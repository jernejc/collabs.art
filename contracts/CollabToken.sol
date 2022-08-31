pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CollabToken is ERC777, AccessControl {

    uint private _conversionRate;

    /**
     * @dev constructor, inits erc20 and does the basic setup
     * @param name token name
     * @param symbol token symbol
     * @param conversionRate token native conversion rate
     * @param developmentRate token development rate
     */
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint conversionRate,
        uint developmentRate
    ) ERC777(name, symbol, defaultOperators) {
        require(
            conversionRate > 0,
            "CollabToken: Conversion rate must be greater than 0"
        );
        require(
            developmentRate > 0,
            "CollabToken: Development rate must be greater than 0"
        );

        // set conversion rate
        _conversionRate = conversionRate;
        // mint development tokens to sender
        _mint(_msgSender(), developmentRate * 10**uint(decimals()), "", "");
        // assign admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev credit $COLAB token for native token
     */
    function credit() public payable {
        uint tokensAmount = msg.value * _conversionRate;

        require(
            tokensAmount > 1 * 10**uint(decimals()),
            "CollabToken: You must credit at least one $COLAB"
        );

        _mint(_msgSender(), tokensAmount, "", "");
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
    function withdraw(uint amount) public onlyAdmin {
        require(amount > 0, "CollabToken: Amount must be greater than 0");
        require(
            address(this).balance >= amount,
            "CollabToken: Enough funds must be available"
        );

        payable(_msgSender()).transfer(amount);
    }

    /********
     * ACL
     */

    /**
     * @dev add minter
     * @param _account address to add as the new minter
     */
    function addAdmin(address _account) public onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, _account);
    }

    /**
     * @dev remove minter
     * @param _account address to remove as minter
     */
    function removeAdmin(address _account) public onlyAdmin {
        revokeRole(DEFAULT_ADMIN_ROLE, _account);
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
