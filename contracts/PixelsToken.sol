pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PixelsToken is ERC20, AccessControl {
    using SafeMath for uint256;

    uint256 private _conversionRate;

    constructor(
        string memory name,
        string memory symbol,
        uint256 conversionRate,
        uint256 developmentRate
    ) ERC20(name, symbol) {
        // set conversion rate
        _conversionRate = conversionRate;
        // mint development tokens to msg.sender
        _mint(_msgSender(), developmentRate * 10**uint256(decimals()));
        // ossign admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function credit() public payable {
        uint256 tokensAmount = msg.value * _conversionRate;

        require(
            tokensAmount > 1 * 10**uint256(decimals()),
            "PixelsToken: You must credit at least one $PXT"
        );

        _mint(_msgSender(), tokensAmount);
    }

    /**
     * @dev set conversionRate
     * @param conversionRate new maximum number of pixels
     */
    function setConversionRate(uint48 conversionRate) public onlyAdmin {
        require(
            conversionRate > 0,
            "PixelsToken: Conversion rate must be greater than 0"
        );

        _conversionRate = conversionRate;
    }
    
    /**
     * @dev withdraw funds
     * @param amount withdraw amount
     */
    function withdraw(uint256 amount) public onlyAdmin {
        require(
            amount > 0,
            "PixelsToken: Amount must be greater than 0"
        );
        require(
            address(this).balance > amount,
            "PixelsToken: Enough funds must be available"
        );

        payable(_msgSender()).transfer(amount);
    }

    /********
     * ACL
     */

    /**
     * @dev Restricted to members of the admin role.
     */
    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "PixelsToken: Restricted to admins."
        );
        _;
    }
}
