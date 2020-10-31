pragma solidity >=0.6.0 <0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./Pixels.sol";

/**
 * @title PixelsBid
 * PixelsBid - non-fungible pixels
 */

contract PixelsBid is Ownable, Pausable {
    Pixels public PixelsContract;
    uint256 public defaultPrice;

    // Represents a bid on a pixel
    struct Bid {
        address seller;
        uint32 price;
        uint64 duration;
    }

    mapping(uint32 => uint256) public bids;

    event Sent(address indexed payee, uint256 amount, uint256 balance);
    event Purchase(
        address indexed payer,
        uint32 position,
        uint256 amount,
        uint256 balance
    );

    /**
     * @dev Contract Constructor
     * @param _pixelsAddress address for Pixels non-fungible token contract
     * @param _defaultPrice initial sales price
     */
    constructor(address _pixelsAddress, uint256 _defaultPrice) public {
        require(
            _pixelsAddress != address(0) && _pixelsAddress != address(this),
            "PixelsBid: Must have a valid contract address"
        );
        require(
            _defaultPrice > 0,
            "PixelsBid: Price must be greater than 0"
        );

        PixelsContract = Pixels(_pixelsAddress);
        defaultPrice = _defaultPrice;
    }

    /**
     * @dev Purchase _position
     * @param _position string pixel position
     * @param _color pixel HEX color
     */
    function purchasePosition(uint32 _position, bytes6 _color)
        public
        payable
        whenNotPaused
    {
        require(
            msg.sender != address(0) && msg.sender != address(this),
            "PixelsBid: Must have valid purchase sender"
        );
        require(
            msg.value >= defaultPrice,
            "PixelsBid: Purchase price must be greater than current price"
        );

        if (!PixelsContract.exists(_position)) {
            PixelsContract.createPixel(_position, _color, msg.sender);
        } else {
            address tokenSeller = PixelsContract.ownerOf(_position);
            PixelsContract.safeTransferFrom(tokenSeller, msg.sender, _position);
        }

        emit Purchase(msg.sender, _position, msg.value, address(this).balance);
    }

    /**
     * @dev send / withdraw _amount to _payee
     * @param _payee address
     * @param _amount uint256
     */
    function sendTo(address payable _payee, uint256 _amount) public onlyOwner {
        require(
            _payee != address(0) && _payee != address(this),
            "PixelsBid: _payee address must be valid"
        );
        require(
            _amount > 0 && _amount <= address(this).balance,
            "PixelsBid: _amount must be avalible and greater than 0"
        );

        _payee.transfer(_amount);

        emit Sent(_payee, _amount, address(this).balance);
    }

    /**
     * @dev Updates _defaultPrice
     * @dev Throws if _defaultPrice is zero
     * @param _defaultPrice uint256
     */
    function setDefaultPrice(uint256 _defaultPrice) public onlyOwner {
        require(
            _defaultPrice > 0,
            "PixelsBid: Default set price must be greater than 0"
        );

        defaultPrice = _defaultPrice;
    }

    /**
     * @dev Updates pixel position price
     * @param _position position for price update
     * @param _price new position price
     */
    function setPixelPrice(uint32 _position, uint256 _price) public {
        require(
            _price > 0,
            "PixelsBid: Pixel price must be greater than 0"
        );
        require(
            PixelsContract.exists(_position),
            "PixelsBid: Pixel position must exist"
        );
        require(
            msg.sender == PixelsContract.ownerOf(_position),
            "PixelsBid: Only owner can change position price"
        );

        prices[_position] = _price;
    }
}
