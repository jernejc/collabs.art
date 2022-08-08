pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./PixelsToken.sol";

/**
 * @title Pixels
 * Pixels - living canvas
 */

contract Pixels is AccessControl {
    using SafeMath for uint256;
    using Address for address;

    PixelsToken private _PixelsTokenContract;

    uint48 private _maxPixels;

    struct Pixel {
        bool exists;
        address owner;
        bytes6 color;
        uint256 bid;
        uint256 modifiedAt;
    }

    mapping(uint256 => Pixel) private _pixels;

    event ColorPixel(
        uint256 position,
        bytes6 color,
        uint256 bid,
        address sender
    );
    event ColorPixels(
        uint256[] positions,
        bytes6[] colors,
        uint256[] bids,
        address sender
    );

    /**
     * @dev Contract Constructor, calls ERC721Batch constructor and sets name and symbol
     */
    constructor(uint48 maxPixels, address pixelsTokenAddress) public {
        require(maxPixels > 0, "Pixels: Max pixels must be greater than 0");

        _maxPixels = maxPixels;

        _PixelsTokenContract = PixelsToken(pixelsTokenAddress); // ERC20 token for bidding
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
            _validateColor(color),
            "Pixels: Must be a valid HEX color value"
        );
        require(
            bid > _pixels[position].bid,
            "Pixels: Bid must be higher than existing"
        );
        require(
            _PixelsTokenContract.transferFrom(msg.sender, address(this), bid)
        );

        // Refund if existing bid
        if (_pixels[position].bid > 0) {
            _PixelsTokenContract.transfer(
                _pixels[position].owner,
                _pixels[position].bid
            );
        }

        _pixels[position] = Pixel({
            exists: true,
            owner: msg.sender,
            color: color,
            bid: bid,
            modifiedAt: block.timestamp
        });

        emit ColorPixel(position, color, bid, msg.sender);
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

        mapping(address => uint256) existingBids;
        uint256 bidsSum = 0;

        // Validate bids and colors and prepare existing bids mapping
        for (uint256 i = 0; i < bids.length; i++) {
            uint256 existingBid = _pixels[positions[i]].bid;
            uint256 existingOwner = _pixels[positions[i]].owner;

            require(
                bids[i] > existingBid,
                "Pixels: All bids must be higher than existing"
            );
            require(
                _validateColor(colors[i]),
                "Pixels: Must be a valid HEX color value"
            );

            // sum all bid values
            bidsSum = bidsSum + bids[i];

            // sum existing bids per address
            if (existingBid > 0) {
                if (existingBids[existingOwner] > 0) {
                    existingBids[existingOwner] =
                        existingBids[existingOwner] +
                        existingBid;
                } else {
                    existingBids[existingOwner] = existingBid;
                }
            }
        }

        // Require for full amount to be available and transfered
        require(
            _PixelsTokenContract.transferFrom(
                msg.sender,
                address(this),
                bidsSum
            )
        );

        for (uint256 i = 0; i < positions.length; i++) {
            uint256 position = positions[i];
            uint256 bid = bids[i];
            bytes6 color = colors[i];

            _pixels[position] = Pixel({
                exists: true,
                owner: msg.sender,
                color: color,
                bid: bid,
                modifiedAt: block.timestamp
            });
        }

        if (_pixels[position].bid > 0) {
            _PixelsTokenContract.transfer(
                _pixels[position].owner,
                _pixels[position].bid
            );
        }

        emit ColorPixels(positions, colors, bids, msg.sender);
    }

    /**
     * @dev set maxPixels
     * @param maxPixels new maximum number of pixels
     */
    function setMaxPixels(uint48 maxPixels) public onlyAdmin {
        require(
            maxPixels > 0,
            "Pixels: Max pixels must be greater than 0 and total current supply"
        );

        _maxPixels = maxPixels;
    }

    /**
     * @dev validate hex color - https://ethereum.stackexchange.com/questions/50369/string-validation-solidity-alpha-numeric-and-length
     * @param color color value to validate
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
        return _pixels[position].exists;
    }

    /********
     * ACL
     */

    /**
     * @dev Restricted to members of the admin role.
     */
    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Pixels: Restricted to admins."
        );
        _;
    }
}
