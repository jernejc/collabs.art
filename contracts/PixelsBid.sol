pragma solidity >=0.6.0 <0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./Pixels.sol";

/**
 * @title PixelsBid
 * PixelsBid - purchase an bid on ERC721 Pixels
 * Inspired by: https://github.com/decentraland/bid-contract/blob/master/contracts/bid/ERC721Bid.sol
 */

contract PixelsBid is Ownable, Pausable {
    using SafeMath for uint256;
    using Address for address;
    using Address for address payable;

    Pixels public PixelsContract;

    uint256 public constant MAX_BID_DURATION = 7 days;
    uint256 public constant MIN_BID_DURATION = 5 minutes;
    uint256 public constant ONE_MILLION = 1000000;

    uint256 public defaultPrice;
    uint256 public contractFee;

    struct Bid {
        address payable bidder;
        uint32 position;
        uint256 price;
        uint256 expiresAt;
    }

    mapping(uint32 => Bid) public bids;

    event Purchase(
        address indexed _payer, 
        uint32 _position, 
        uint256 _amount
    );

    event BidCreated(
        uint256 indexed _position,
        address indexed _bidder,
        uint256 _price,
        uint256 _expiresAt
    );

    event BidAccepted(
        uint256 indexed _position,
        address _bidder,
        address indexed _seller,
        uint256 _price,
        uint256 _fee,
        uint256 _contractFee
    );

    event BidCancelled(
        uint256 indexed _position, 
        address indexed _bidder
    );

    /**
     * @dev Contract Constructor
     * @param _pixelsAddress address for Pixels non-fungible token contract
     * @param _defaultPrice initial sales price
     */
    constructor(address _pixelsAddress, uint256 _defaultPrice, uint256 _contractFee) 
        public 
    {
        require(
            _pixelsAddress != address(0) && _pixelsAddress != address(this),
            "PixelsBid: Must have a valid contract address"
        );
        require(
            _pixelsAddress.isContract(),
            "PixelsContract should be a contract"
        );
        require(
            _defaultPrice > 0, 
            "PixelsBid: Default price must be greater than 0"
        );
        require(
            _contractFee > 0, 
            "PixelsBid: Contract fee must be greater than 0"
        );

        PixelsContract = Pixels(_pixelsAddress);
        defaultPrice = _defaultPrice;
        contractFee = _contractFee;
    }

    /**
     * @dev Purchase _position
     * You can only purchase non-existing pixels within the given range of positions
     * @param _position string pixel position
     * @param _color pixel HEX color
     */
    function purchase(uint32 _position, bytes6 _color)
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
        require(
            !PixelsContract.exists(_position),
            "PixelsBid: You can only purchase a non-existing pixel"
        );

        PixelsContract.createPixel(_position, _color, msg.sender);

        emit Purchase(msg.sender, _position, msg.value);
    }

    /**
     * @dev Place bid for pixel position
     * @param _position position for price update
     * @param _duration bid duration
     */
    function placeBid(uint32 _position, uint256 _duration) 
        public 
        payable 
        whenNotPaused 
    {
        require(
            msg.value > bids[_position].price, // Solidity will return 0 if there is no existing bid
            "PixelsBid: Bid amount should be greater than 0 or currently highest bid"
        );
        require(
            PixelsContract.exists(_position),
            "PixelsBid: Pixel position must exist"
        );
        require(
            _duration >= MIN_BID_DURATION,
            "The bid should be last longer than 3 minutes"
        );
        require(
            _duration <= MAX_BID_DURATION,
            "The bid can not last longer than 7 days"
        );

        if (bids[_position].price > 0) { // The pixel has an existing bid, refund it
            _refundBid(_position);
        }

        uint256 expiresAt = block.timestamp.add(_duration);

        bids[_position] = Bid({
            bidder: msg.sender,
            position: _position,
            price: msg.value,
            expiresAt: expiresAt
        });

        emit BidCreated(
            _position,
            msg.sender,
            msg.value,
            expiresAt
        );
    }

    /**
    * @dev Used as the only way to accept a bid.
    * @param _position pixel position
    */
    function acceptBid(uint32 _position)
        public
        whenNotPaused
    {
        require(
            bids[_position].price > 0, // Solidity will return 0 if there is no existing bid
            "PixelsBid: No active bid for given pixel"
        );

        Bid memory bid = _getBid(_position);

        require(
            bid.expiresAt >= block.timestamp,
            "PixelsBid: Bid has expired"
        );
        require(
            msg.sender == PixelsContract.ownerOf(_position),
            "PixelsBid: Only the pixel owner can accept a bid"
        );

        address bidder = bid.bidder;
        uint256 price = bid.price;
        uint256 feeAmount = price.mul(contractFee).div(ONE_MILLION);
        uint256 tokenOwnerAmout = price.sub(feeAmount);

        delete bids[_position];
        
        PixelsContract.safeTransferFrom(msg.sender, bidder, _position);

        msg.sender.sendValue(tokenOwnerAmout);
       
        emit BidAccepted(
            _position,
            bidder,
            msg.sender,
            tokenOwnerAmout,
            feeAmount,
            contractFee
        );
    }

    /**
    * @dev Get current active bid for pixel
    * @param _position pixel position
    * @return address of the bidder address
    * @return uint256 of the bid price
    * @return uint256 of the expiration time
    */
    function getBidForPixel(uint32 _position) 
        public 
        view
        returns (address payable, uint256, uint256) 
    {
        require(
            bids[_position].price > 0, // Solidity will return 0 if there is no existing bid
            "PixelsBid: No active bid for given pixel"
        );
        
        Bid memory bid = _getBid(_position);

        return (
            bid.bidder,
            bid.price,
            bid.expiresAt
        );
    }

    /**
     * @dev send / withdraw _amount to _payee
     * @param _payee address
     * @param _amount uint256
     */
    function transferFunds(address payable _payee, uint256 _amount)
        external
        onlyOwner
    {
        require(
            _payee != address(0) && _payee != address(this),
            "PixelsBid: _payee address must be valid"
        );
        require(
            _amount > 0 && _amount <= address(this).balance,
            "PixelsBid: _amount must be available and greater than 0"
        );

        _payee.sendValue(_amount);
    }

    /**
     * @dev Update default purchase price
     * @dev Throws if _defaultPrice is zero
     * @param _defaultPrice uint256
     */
    function setDefaultPrice(uint256 _defaultPrice) 
        external 
        onlyOwner 
    {
        require(
            _defaultPrice > 0,
            "PixelsBid: Default set price must be greater than 0"
        );

        defaultPrice = _defaultPrice;
    }

    /**
    * @dev Sets the fee for contract that's
    * charged to the seller on a successful sale
    * @param _contractFee Share amount, from 0 to 999,999
    */
    function setContractFee(uint256 _contractFee) 
        external 
        onlyOwner 
    {
        require(
            _contractFee < ONE_MILLION, 
            "The owner cut should be between 0 and 999,999"
        );

        contractFee = _contractFee;
    }

    /**
    * @dev Refund bid for pixel
    * @param _position pixel position
    */
    function _refundBid(uint32 _position) 
        internal
    {
        Bid memory existingBid = _getBid(_position);

        address payable bidder = existingBid.bidder;
        uint256 price = existingBid.price;
        
        delete bids[_position];

        bidder.sendValue(price);
    }

    /**
    * @dev Get bid for pixel 
    * @param _position - pixel position
    * @return Bid
    */
    function _getBid(uint32 _position) 
        internal 
        view 
        returns (Bid memory)
    {
        return bids[_position];
    }
}
