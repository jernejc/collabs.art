pragma solidity >=0.6.0 <0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Pixels
 * Pixels - non-fungible ERC721 pixels
 */

contract Pixels is ERC721, Ownable {
    uint48 maxPixels = 1000000;

    mapping(uint32 => Pixel) public pixels;

    struct Pixel {
        uint48 createTime;
        string color;
    }

    /**
     * @dev Contract Constructor, calls ERC721 constructor and sets name and symbol
     */
    constructor() public ERC721("PixelWorld", "PW") {}

    /**
     * @dev Create new pixel
     * @param _position pixel position in the world / id
     * @param _color pixel HEX color
     * @param _owner owner of the newly created pixel
     */
    function createPixel(
        uint32 _position,
        string memory _color,
        address _owner
    ) public {
        require(_position > 0, "Pixels: Position must be provided");
        require(
            totalSupply() + 1 <= maxPixels,
            "Pixels: Cannot create more than max amount of pixels"
        );
        require(
            validateHEXStr(_color),
            "Pixels: Must be a valid HEX color value"
        );

        Pixel memory p = Pixel({createTime: uint48(now), color: _color});

        pixels[_position] = p;

        _mint(_owner, _position);
    }

    /**
     * @dev Get pixel color
     * @param _position pixel position in the world / id
     */
    function getColor(uint32 _position) public view returns (string memory) {
        require(
            exists(_position),
            "Pixels: Make sure position exists before returning color"
        );

        return pixels[_position].color;
    }

    /**
     * @dev Validate and set pixel color
     * @param _position pixel position in the world / id
     * @param _color pixel HEX color
     */
    function setColor(uint32 _position, string memory _color) public {
        require(
            exists(_position),
            "Pixels: Make sure position exists before setting color"
        );
        require(
            msg.sender == ownerOf(_position),
            "Pixels: Only the owner can change color"
        );
        require(
            validateHEXStr(_color),
            "Pixels: Must be a valid HEX color value"
        );

        pixels[_position].color = _color;
    }

    /**
     * @dev expose _exists to the public
     * @param _position pixel position in the world / id
     */
    function exists(uint32 _position) public view returns (bool) {
        return _exists(_position);
    }

    /**
     * @dev validate hex color - https://ethereum.stackexchange.com/questions/50369/string-validation-solidity-alpha-numeric-and-length
     * @param _str pixel position in the world / id
     */
    function validateHEXStr(string memory _str) private pure returns (bool) {
        bytes memory b = bytes(_str);
        if (b.length != 6) return false;

        for (uint256 i; i < b.length; i++) {
            bytes1 char = b[i];

            if (
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) //a-z
            ) return false;
        }

        return true;
    }
}
