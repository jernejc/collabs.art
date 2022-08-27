pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

import "./CollabToken.sol";

/**
 * @title Pixels
 * Pixels - living canvas
 */

contract Pixels is AccessControl, IERC777Recipient {
    using SafeMath for uint256;
    using Address for address;

    IERC1820Registry private _erc1820 =
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH =
        keccak256("ERC777TokensRecipient");

    CollabToken private _CollabTokenContract;

    uint256 private _maxPixels;
    uint256 private _minUnit;

    mapping(bytes6 => bool) private _supportedColors;

    mapping(uint256 => address) private _owners;
    mapping(uint256 => bytes6) private _colors;
    mapping(uint256 => uint256) private _bids;

    event ColorPixel(
        uint256 position,
        bytes6 color,
        uint256 bid,
        address owner
    );
    event ColorPixels(
        uint256[] positions,
        bytes6[] colors,
        uint256[] bids,
        address owner
    );
    event TokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes userData,
        bytes operatorData
    );

    /**
     * @dev Contract Constructor, sets max pixels
     */
    constructor(uint256 maxPixels, uint256 minUnit) {
        require(maxPixels > 0, "Pixels: Max pixels must be greater than 0");
        require(minUnit > 0, "Pixels: Min unit must be greater than 0");

        // set max pixels limit
        _maxPixels = maxPixels;
        // set min unit
        _minUnit = minUnit;
        // assign admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // register erc 777 reciever
        _erc1820.setInterfaceImplementer(
            address(this),
            TOKENS_RECIPIENT_INTERFACE_HASH,
            address(this)
        );
    }

    /**
     * @dev Get pixel color
     * @param position pixel position in the world / id
     */
    function getColor(uint256 position) public view returns (bytes6) {
        require(
            _exists(position),
            "Pixels: Make sure position exists before returning color"
        );

        return _colors[position];
    }

    /**
     * @dev Validate and set pixel color
     * @param position pixel position in the world / id
     * @param color pixel HEX color
     * @param bid pixel bid amount
     */
    function setColor(
        uint256 position,
        bytes6 color,
        uint256 bid
    ) public {
        require(
            _supportedColor(color),
            "Pixels: Must be a valid HEX color value"
        );
        require(
            bid >= (_bids[position] + _minUnit),
            "Pixels: Bid must be higher than existing"
        );

        _CollabTokenContract.operatorSend(
            _msgSender(),
            address(this),
            bid,
            "",
            ""
        );

        _updatePosition(position, color, bid, _msgSender());

        emit ColorPixel(position, color, bid, _msgSender());
    }

    /**
     * @dev Validate and set position color
     * @param positions array of positions in the world / id
     * @param colors array of string HEX color
     * @param bids array of bid amounts
     */
    function setColors(
        uint256[] memory positions,
        bytes6[] memory colors,
        uint256[] memory bids
    ) public {
        require(
            positions.length == colors.length,
            "Pixels: positions and colors length mismatch"
        );
        require(
            positions.length == bids.length,
            "Pixels: positions and bids length mismatch"
        );

        uint256 bidsSum = 0;

        // Validate bids and colors and prepare existing bids mapping
        for (uint256 i = 0; i < bids.length; i++) {
            require(
                bids[i] >= (_bids[positions[i]] + _minUnit),
                "Pixels: All bids must be higher than existing"
            );
            require(
                _supportedColor(colors[i]),
                "Pixels: Must be a valid HEX color value"
            );

            // sum all bid values
            bidsSum = bidsSum + bids[i];
        }

        // Require for full amount to be available and transfered
        _CollabTokenContract.operatorSend(
            _msgSender(),
            address(this),
            bidsSum,
            "",
            ""
        );

        for (uint256 i = 0; i < positions.length; i++) {
            uint256 position = positions[i];
            bytes6 color = colors[i];
            uint256 bid = bids[i];

            _updatePosition(position, color, bid, _msgSender());
        }

        emit ColorPixels(positions, colors, bids, _msgSender());
    }

    /**
     * @dev tokens received
     * @param operator operator
     * @param from from
     * @param to to
     * @param amount amount
     * @param userData userData
     * @param operatorData operatorData
     */

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {
        require(
            msg.sender == address(_CollabTokenContract),
            "Pixels: ERC777Recipient Invalid token"
        );

        //emit TokensReceived(operator, from, to, amount, userData, operatorData);
    }

    /**
     * @dev update position
     * @param position position in the world
     * @param color new position color
     * @param bid bid amount
     * @param owner new owner
     */

    function _updatePosition(
        uint256 position,
        bytes6 color,
        uint256 bid,
        address owner
    ) private {
        // Refund if existing bid
        if (_bids[position] > 0) {
            _CollabTokenContract.send(_owners[position], _bids[position], "");
        }

        _owners[position] = owner;
        _colors[position] = color;
        _bids[position] = bid;
    }

    /**
     * @dev set maxPixels
     * @param maxPixels new maximum number of pixels
     */
    function setMaxPixels(uint256 maxPixels) public onlyAdmin {
        require(
            maxPixels > 0,
            "Pixels: Max pixels must be greater than 0 and total current supply"
        );

        _maxPixels = maxPixels;
    }
    
    /**
     * @dev set minUnit
     * @param minUnit min bid unit
     */
    function setMinUnit(uint256 minUnit) public onlyAdmin {
        require(
            minUnit > 0,
            "Pixels: Min unit for bid increase"
        );

        _minUnit = minUnit;
    }

    /**
     * @dev set token contract
     * @param colabTokenAddress token contract address
     */
    function setTokenContract(address colabTokenAddress) public onlyAdmin {
        require(
            colabTokenAddress.isContract(),
            "Pixels: token address is not contract"
        );

        // initialize token contract
        _CollabTokenContract = CollabToken(colabTokenAddress);
    }

    /**
     * @dev set token contract
     * @param supportedColors array of hex format colors (without #)
     */
    function setSupportedColors(bytes6[] memory supportedColors)
        public
        onlyAdmin
    {
        for (uint8 i = 0; i < supportedColors.length; i++) {
            require(
                _validateColor(supportedColors[i]),
                "Pixels: must be valid HEX color"
            );

            _supportedColors[supportedColors[i]] = true;
        }
    }

    /**
     * @dev check if supported color
     * @param color value to validate
     */
    function _supportedColor(bytes6 color) private view returns (bool) {
        return _supportedColors[color] == true;
    }

    /**
     * @dev validate hex color - https://ethereum.stackexchange.com/questions/50369/string-validation-solidity-alpha-numeric-and-length
     * @param color value to validate
     */
    function _validateColor(bytes6 color) private pure returns (bool) {
        for (uint8 i; i < color.length; i++) {
            bytes1 char = color[i];

            if (
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) //a-z
            ) return false;
        }

        return true;
    }

    /**
     * @dev Returns whether position exists
     * @param position pixel position
     */
    function _exists(uint256 position) private view returns (bool) {
        return _bids[position] > 0;
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
            "Pixels: Restricted to admins."
        );
        _;
    }
}
