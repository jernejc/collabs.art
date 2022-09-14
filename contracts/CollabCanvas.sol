pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./CollabToken.sol";

/**
 * @title CollabCanvas
 */

contract CollabCanvas is AccessControl {
    using Address for address;

    CollabToken private _CollabTokenContract;

    uint256 private _maxPixels;
    uint256 private _minUnit;

    mapping(address => uint256) private _existingBids;
    mapping(bytes6 => bool) private _supportedColors;

    struct Pixel {
        address owner;
        bytes6 color;
        uint256 bid;
    }

    mapping(uint256 => Pixel) private _pixels;

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

    /**
     * @dev Contract Constructor, sets max pixels
     */
    constructor(uint256 maxPixels, uint256 minUnit) {
        require(
            maxPixels > 0,
            "CollabCanvas: Max pixels must be greater than 0"
        );
        require(minUnit > 0, "CollabCanvas: Min unit must be greater than 0");

        // set max pixels limit
        _maxPixels = maxPixels;
        // set min unit
        _minUnit = minUnit;
        // assign admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Get pixel color
     * @param position pixel position in the world / id
     */
    function getColor(uint256 position) public view returns (bytes6) {
        require(
            _exists(position),
            "CollabCanvas: Make sure position exists before returning color"
        );

        return _pixels[position].color;
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
            "CollabCanvas: Must be a valid HEX color value"
        );
        require(
            bid >= (_pixels[position].bid + _minUnit),
            "CollabCanvas: Bid must be higher than existing"
        );

        require(
            _CollabTokenContract.operatorSend(_msgSender(), address(this), bid),
            "CollabCanvas: Failed to transfer $COLAB"
        );

        if (_pixels[position].bid > 0) { // refund existing
            _CollabTokenContract.transfer(
                _pixels[position].owner,
                _pixels[position].bid
            );

            delete _pixels[position];
        }

        _pixels[position] = Pixel({
            owner: _msgSender(),
            color: color,
            bid: bid
        });

        emit ColorPixel(position, color, bid, _msgSender());
    }

    /**
     * @dev Validate and set position color
     * @param positions array of positions in the world / id
     * @param colors array of string HEX color
     * @param bids array of bid amounts
     */
    function setColors(
        uint256[] calldata positions,
        bytes6[] calldata colors,
        uint256[] calldata bids
    ) public {
        require(
            positions.length == colors.length,
            "CollabCanvas: positions and colors length mismatch"
        );
        require(
            positions.length == bids.length,
            "CollabCanvas: positions and bids length mismatch"
        );

        uint256 bidsSum = 0;

        // Validate bids and colors and prepare existing bids mapping
        for (uint256 i = 0; i < bids.length; i++) {
            require(
                bids[i] >= (_pixels[positions[i]].bid + _minUnit),
                "CollabCanvas: All bids must be higher than existing"
            );
            require(
                _supportedColor(colors[i]),
                "CollabCanvas: Must be a valid HEX color value"
            );

            // sum all bid values
            bidsSum += bids[i];
        }

        // Require for full amount to be available and transfered
        require(
            _CollabTokenContract.operatorSend(
                _msgSender(),
                address(this),
                bidsSum
            ),
            "CollabCanvas: Failed to transfer $COLAB"
        );

        address[] memory existingOwners = new address[](positions.length);

        for (uint256 i = 0; i < positions.length; i++) {
            Pixel memory pixel = _pixels[positions[i]];

            if (pixel.bid > 0) {
                if (_existingBids[pixel.owner] == 0) {
                    existingOwners[i] = pixel.owner;
                }

                _existingBids[pixel.owner] += pixel.bid;

                delete _pixels[positions[i]];
            }

            _pixels[positions[i]] = Pixel({
                owner: _msgSender(),
                color: colors[i],
                bid: bids[i]
            });
        }

        if (existingOwners.length > 0) {
            for (uint256 i = 0; i < existingOwners.length; i++) {
                address existingOwner = existingOwners[i];

                if (_existingBids[existingOwner] > 0) {
                    _CollabTokenContract.transfer(
                        existingOwner,
                        _existingBids[existingOwner]
                    );

                    delete _existingBids[existingOwner];
                }
            }
        }

        emit ColorPixels(positions, colors, bids, _msgSender());
    }

    /**
     * @dev set maxPixels
     * @param maxPixels new maximum number of pixels
     */
    function setMaxPixels(uint256 maxPixels) public onlyAdmin {
        require(
            maxPixels > 0,
            "CollabCanvas: Max pixels must be greater than 0 and total current supply"
        );

        _maxPixels = maxPixels;
    }

    /**
     * @dev Get max pixels
     */
    function getMaxPixels() public view returns (uint256) {
        return _maxPixels;
    }

    /**
     * @dev set minUnit
     * @param minUnit min bid unit
     */
    function setMinUnit(uint256 minUnit) public onlyAdmin {
        require(minUnit > 0, "CollabCanvas: Min unit for bid increase");

        _minUnit = minUnit;
    }

    /**
     * @dev Get max pixels
     */
    function getMinUnit() public view returns (uint256) {
        return _minUnit;
    }

    /**
     * @dev set token contract
     * @param colabTokenAddress token contract address
     */
    function setTokenContract(address colabTokenAddress) public onlyAdmin {
        require(
            colabTokenAddress.isContract(),
            "CollabCanvas: token address is not contract"
        );

        // initialize token contract
        _CollabTokenContract = CollabToken(colabTokenAddress);
    }

    /**
     * @dev set token contract
     * @param supportedColors array of hex format colors (without #)
     */
    function setSupportedColors(bytes6[] calldata supportedColors)
        public
        onlyAdmin
    {
        for (uint8 i = 0; i < supportedColors.length; i++) {
            require(
                _validateColor(supportedColors[i]),
                "CollabCanvas: must be valid HEX color"
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
        return _pixels[position].bid > 0;
    }

    /********
     * ACL
     */

    /**
     * @dev add admin
     * @param _account address to add as the new admin
     */
    function addAdmin(address _account) public onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, _account);
    }

    /**
     * @dev remove admin
     * @param _account address to remove as admin
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
            "CollabCanvas: Restricted to admins."
        );
        _;
    }
}
