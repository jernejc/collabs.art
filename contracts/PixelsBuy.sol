pragma solidity >=0.6.0 <0.7.3;

import "./Pixels.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
    uint256 public currentPrice;

    /**
     * @dev Contract Constructor
     * @param _contractAddress address for Pixels non-fungible token contract
     * @param _currentPrice initial sales price
     */
    constructor(address _contractAddress, uint256 _currentPrice) public {
        require(
            _contractAddress != address(0) && _contractAddress != address(this),
            "Must have a valid contract address"
        );
        require(_currentPrice > 0, "Price must be greater than 0");

        PixelsContract = Pixels(_contractAddress);
        currentPrice = _currentPrice;
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
            "Must have valid purchase sender"
        );
        require(
            msg.value >= currentPrice,
            "Purchase price must be greater than current price"
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
            "_payee address must be valid"
        );
        require(
            _amount > 0 && _amount <= address(this).balance,
            "_amount must be avalible and greater than 0"
        );

        _payee.transfer(_amount);

        emit Sent(_payee, _amount, address(this).balance);
    }

    /**
     * @dev Updates _currentPrice
     * @dev Throws if _currentPrice is zero
     * @param _currentPrice uint256
     */
    function setCurrentPrice(uint256 _currentPrice) public onlyOwner {
        require(_currentPrice > 0, "Current set price must be greater than 0");

        currentPrice = _currentPrice;
    }
}
