pragma solidity >=0.6.0 <0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./Pixels.sol";

/**
 * @title PixelsBuy
 * PixelsBuy - non-fungible pixels
 */

contract PixelsBuy is Ownable, Pausable {
    event Sent(address indexed payee, uint256 amount, uint256 balance);

    event Received(
        address indexed payer,
        uint32 position,
        uint256 amount,
        uint256 balance
    );

    Pixels public PixelsContract;
    uint256 public defaultPrice;

    mapping(uint32 => uint256) public prices;

    /**
     * @dev Contract Constructor
     * @param _contractAddress address for Pixels non-fungible token contract
     * @param _defaultPrice initial sales price
     */
    constructor(address _contractAddress, uint256 _defaultPrice) public {
        require(
            _contractAddress != address(0) && _contractAddress != address(this),
            "PixelsBuy: Must have a valid contract address"
        );
        require(_defaultPrice > 0, "PixelsBuy: Price must be greater than 0");

        PixelsContract = Pixels(_contractAddress);
        defaultPrice = _defaultPrice;
    }

    /**
     * @dev Purchase _position
     * @param _position string pixel position
     * @param _color pixel HEX color
     */
    function purchasePosition(uint32 _position, string memory _color)
        public
        payable
        whenNotPaused
    {
        require(
            msg.sender != address(0) && msg.sender != address(this),
            "PixelsBuy: Must have valid purchase sender"
        );
        require(
            msg.value >= defaultPrice,
            "PixelsBuy: Purchase price must be greater than current price"
        );

        if (!PixelsContract.exists(_position)) {
            PixelsContract.createPixel(_position, _color, msg.sender);
        } else {
            address tokenSeller = PixelsContract.ownerOf(_position);
            PixelsContract.safeTransferFrom(tokenSeller, msg.sender, _position);
        }

        emit Received(msg.sender, _position, msg.value, address(this).balance);
    }

    /**
     * @dev send / withdraw _amount to _payee
     * @param _payee address
     * @param _amount uint256
     */
    function sendTo(address payable _payee, uint256 _amount) public onlyOwner {
        require(
            _payee != address(0) && _payee != address(this),
            "PixelsBuy: _payee address must be valid"
        );
        require(
            _amount > 0 && _amount <= address(this).balance,
            "PixelsBuy: _amount must be avalible and greater than 0"
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
            "PixelsBuy: Default set price must be greater than 0"
        );

        defaultPrice = _defaultPrice;
    }

    /**
     * @dev Updates pixel position price
     * @param _position position for price update
     * @param _price new position price
     */
    function setPixelPrice(uint32 _position, uint256 _price) public {
        require(_price > 0, "PixelsBuy: Pixel price must be greater than 0");
        require(
            PixelsContract.exists(_position),
            "PixelsBuy: Pixel position must exist"
        );
        require(
            msg.sender == PixelsContract.ownerOf(_position),
            "PixelsBuy: Only owner can change position price"
        );

        prices[_position] = _price;
    }
}
