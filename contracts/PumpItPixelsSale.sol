pragma solidity >=0.4.21 < 0.7.0;


import "node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "node_modules/@openzeppelin/contracts/ownership/Ownable.sol";
import "node_modules/@openzeppelin/contracts/lifecycle/Pausable.sol";
//import "node_modules/@openzeppelin/contracts/lifecycle/Destructible.sol";

/**
 * @title PumpItPixelsSale
 * PumpItPixelSales - non-fungible tokens for advertising space
 */
contract PumpItPixelsSale is Ownable, Pausable /*, Destructible */ {
    event Sent(address indexed payee, uint256 amount, uint256 balance);
    event Received(
        address indexed payer,
        uint256 position,
        uint256 amount,
        uint256 balance
    );

    ERC721 public contractAddress;
    uint256 public currentPrice;

    /**
     * @desc Contract Constructor
     * @param _contractAddress address for Crypto Arte non-fungible token contract
     * @param _currentPrice initial sales price
     */
    constructor(address _contractAddress, uint256 _currentPrice) public {
        require(_contractAddress != address(0) && _contractAddress != address(this), "Must have a valid contract address");
        require(_currentPrice > 0, "Price must be greater than 0");
        contractAddress = ERC721(_contractAddress);
        currentPrice = _currentPrice;
    }

    /**
     * @desc Purchase _position
     * @param _position uint256 pixel position
     */
    function purchasePosition(uint256 _position) public payable whenNotPaused {
        require(msg.sender != address(0) && msg.sender != address(this), "Must have valid purchase sender");
        require(msg.value >= currentPrice, "Purchase price must be greater than current price");
        require(contractAddress.exists(_position), "Pixel must exist");
        address tokenSeller = contractAddress.ownerOf(_position);
        contractAddress.safeTransferFrom(tokenSeller, msg.sender, _position);
        emit Received(msg.sender, _position, msg.value, address(this).balance);
    }

    /**
     * @desc send / withdraw _amount to _payee
     */
    function sendTo(address _payee, uint256 _amount) public onlyOwner {
        require(_payee != address(0) && _payee != address(this), "_payee address must be valid");
        require(_amount > 0 && _amount <= address(this).balance, "_amount must be avalible and greater than 0");
        _payee.transfer(_amount);
        emit Sent(_payee, _amount, address(this).balance);
    }

    /**
     * @desc Updates _currentPrice
     * @desc Throws if _currentPrice is zero
     */
    function setCurrentPrice(uint256 _currentPrice) public onlyOwner {
        require(_currentPrice > 0, "Current set price must be greater than 0");
        currentPrice = _currentPrice;
    }
}
