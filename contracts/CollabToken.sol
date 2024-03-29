pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * Based on ERC20 with some additinonal features
 *
 * - ERC20Permit for allowance increase without gas fees
 * - ERC777 inspired 'operator' concept (allows opt-out)
 */

contract CollabToken is ERC20Pausable, ERC20Permit, AccessControl {
    uint256 private _conversionRate;

    // This isn't ever read from - it's only used to respond to the defaultOperators query.
    address[] private _defaultOperatorsArray;

    // Immutable, but accounts may revoke them (tracked in __revokedDefaultOperators).
    mapping(address => bool) private _defaultOperators;

    // For each account, a mapping of its operators and revoked default operators.
    mapping(address => mapping(address => bool)) private _operators;
    mapping(address => mapping(address => bool))
        private _revokedDefaultOperators;

    // solhint-disable-next-line var-name-mixedcase
    bytes32 private constant _PERMIT_TYPEHASH =
        keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

    /**
     * @dev Emitted when `operator` is made operator for `tokenHolder`
     */
    event AuthorizedOperator(
        address indexed operator,
        address indexed tokenHolder
    );

    /**
     * @dev Emitted when `operator` is revoked its operator status for `tokenHolder`
     */
    event RevokedOperator(
        address indexed operator,
        address indexed tokenHolder
    );

    /**
     * @dev Emitted when permit is triggered
     */
    event Permit(
        address owner,
        address spender,
        uint256 value,
        string category
    );

    /**
     * @dev constructor, inits erc20 and does the basic setup
     * @param name_ token name
     * @param symbol_ token symbol
     * @param defaultOperators_ array of default operators
     * @param conversionRate_ token presale conversion rate
     * @param intialSupply_ token initial supply
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address[] memory defaultOperators_,
        uint256 conversionRate_,
        uint256 intialSupply_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        require(
            conversionRate_ > 0,
            "CollabToken: Conversion rate must be greater than 0"
        );
        require(
            intialSupply_ > 0,
            "CollabToken: Initial supply must be greater than 0"
        );

        _defaultOperatorsArray = defaultOperators_;
        for (uint256 i = 0; i < defaultOperators_.length; i++) {
            _defaultOperators[defaultOperators_[i]] = true;
        }

        // set conversion rate
        _conversionRate = conversionRate_;
        // mint initial supply to sender
        _mint(_msgSender(), intialSupply_ * 10**uint256(decimals()));
        // assign admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev credit $COLAB token for native token
     */
    function credit() public payable {
        uint256 tokensAmount = msg.value * _conversionRate;

        require(
            tokensAmount > 1 * 10**uint256(decimals()),
            "CollabToken: You must credit at least one $COLAB"
        );
        require(!paused(), "CollabToken: credit token while paused");

        _mint(_msgSender(), tokensAmount);
    }

    /**
     * @dev set conversionRate
     * @param conversionRate new maximum number of pixels
     */
    function setConversionRate(uint48 conversionRate) public onlyAdmin {
        require(
            conversionRate > 0,
            "CollabToken: Conversion rate must be greater than 0"
        );

        _conversionRate = conversionRate;
    }

    /**
     * @dev withdraw funds
     * @param amount withdraw amount
     */
    function withdraw(uint256 amount) public onlyAdmin {
        require(amount > 0, "CollabToken: Amount must be greater than 0");
        require(
            address(this).balance >= amount,
            "CollabToken: Enough funds must be available"
        );
        require(!paused(), "CollabToken: withdraw token while paused");

        payable(_msgSender()).transfer(amount);
    }

    /*******
     * Operators
     * Based on ERC777 operators
     * https://docs.openzeppelin.com/contracts/2.x/api/token/erc777

     * - uses _transfer instead of _move
     * - emits single event
     * - does not trigger callback
     * - returns boolean
     */

    /**
     * @dev See {IERC777-isOperatorFor}.
     */
    function isOperatorFor(address operator, address tokenHolder)
        public
        view
        virtual
        returns (bool)
    {
        return
            operator == tokenHolder ||
            (_defaultOperators[operator] &&
                !_revokedDefaultOperators[tokenHolder][operator]) ||
            _operators[tokenHolder][operator];
    }

    /**
     * @dev See {IERC777-authorizeOperator}.
     */
    function authorizeOperator(address operator) public virtual {
        require(
            _msgSender() != operator,
            "CollabToken: authorizing self as operator"
        );

        if (_defaultOperators[operator]) {
            delete _revokedDefaultOperators[_msgSender()][operator];
        } else {
            _operators[_msgSender()][operator] = true;
        }

        emit AuthorizedOperator(operator, _msgSender());
    }

    /**
     * @dev See {IERC777-revokeOperator}.
     */
    function revokeOperator(address operator) public virtual {
        require(operator != _msgSender(), "ERC777: revoking self as operator");

        if (_defaultOperators[operator]) {
            _revokedDefaultOperators[_msgSender()][operator] = true;
        } else {
            delete _operators[_msgSender()][operator];
        }

        emit RevokedOperator(operator, _msgSender());
    }

    /**
     * @dev See {IERC777-defaultOperators}.
     */
    function defaultOperators() public view virtual returns (address[] memory) {
        return _defaultOperatorsArray;
    }

    /**
     * @dev See {IERC777-operatorSend}.
     */
    function operatorSend(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual returns (bool) {
        require(
            isOperatorFor(_msgSender(), sender),
            "CollabToken: caller is not an operator for holder"
        );
        _transfer(sender, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC777-operatorBurn}.
     */
    function operatorBurn(address account, uint256 amount)
        public
        virtual
        returns (bool)
    {
        require(
            isOperatorFor(_msgSender(), account),
            "CollabToken: caller is not an operator for holder"
        );
        _burn(account, amount);
        return true;
    }

    /********
     * ERC20Permit
     * Permit override
     */

    /**
     * @dev See {IERC20Permit-permit}.
     */
    function grant(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        string memory category,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= deadline, "CollabToken: expired deadline");

        bytes32 structHash = keccak256(
            abi.encode(
                _PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                _useNonce(owner),
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "CollabToken: invalid signature");

        _transfer(owner, spender, value);

        emit Permit(owner, spender, value, category);
    }

    /********
     * Pause
     */

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     */
    function pause() public onlyAdmin {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     */
    function unpause() public onlyAdmin {
        _unpause();
    }

    /**
     * @dev _beforeTokenTransfer override
     * Both contracts define it, so we must override
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /********
     * ACL
     */

    /**
     * @dev add admin
     * @param account address to add as the new admin
     */
    function addAdmin(address account) public onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, account);
    }

    /**
     * @dev remove admin
     * @param account address to remove as admin
     */
    function removeAdmin(address account) public onlyAdmin {
        revokeRole(DEFAULT_ADMIN_ROLE, account);
    }

    /**
     * @dev Restricted to members of the admin role.
     */
    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "CollabToken: Restricted to admins."
        );
        _;
    }
}
