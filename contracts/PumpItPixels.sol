pragma solidity ^0.6.2;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/IERC721Enumerable.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/Ownable.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/utils/EnumerableSet.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/utils/EnumerableMap.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/utils/Address.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract PumpItPixels is IERC721, IERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    bytes4 private constant _ERC721_INTERFACE = 0x6466353c;
    bytes4 private constant _ERC721_INTERFACE_ENUMERABLE = 0x780e9d63;
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    uint256 maxPixels = 1000;

    mapping(address => EnumerableSet.UintSet) private _holderTokens;
    EnumerableMap.UintToAddressMap private _tokenOwners;

    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    mapping(uint256 => Pixel) public pixels;

    struct Pixel {
        uint256 position;
        uint64 createTime;
        string color;
        bool isValue;
    }

    constructor() public {}

    function totalSupply() public override view returns (uint256) {
        return _tokenOwners.length();
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        public
        override
        view
        returns (uint256)
    {
        return _holderTokens[owner].at(index);
    }

    function tokenByIndex(uint256 index) public override view returns (uint256) {
        (uint256 tokenId, ) = _tokenOwners.at(index);
        return tokenId;
    }

    function mint(uint256 _position, string memory _color) public onlyOwner {
        require(_position > 0, "Position must be provided");
        require(msg.sender != address(0), "ERC721: mint to the zero address");
        require(!_exists(_position), "Position token already minted");
        require(
            totalSupply() + 1 < maxPixels,
            "Cannot create more than max amount of pixels"
        );
        require(validateHEXStr(_color), "Must be a valid HEX color value");

        pixels[_position] = Pixel({
            position: _position,
            createTime: uint64(now),
            color: _color,
            isValue: true
        });

        _transfer(address(0), msg.sender, _position);
    }

    function getColor(uint256 _position) public view returns (string memory) {
        require(
            _exists(_position),
            "Make sure position exists before returning color"
        );
        return pixels[_position].color;
    }

    function setColor(uint256 _position, string memory _color) public {
        require(
            _exists(_position),
            "Make sure position exists before setting color"
        );
        require(
            msg.sender == ownerOf(_position),
            "Only the owner can change color"
        );
        require(validateHEXStr(_color), "Must be a valid HEX color value");

        pixels[_position].color = _color;
    }

    function exists(uint256 _position) public view returns (bool) {
        return _exists(_position);
    }

    function _exists(uint256 _position) internal view returns (bool) {
        return pixels[_position].isValue;
    }

    // ERC 721 overrides, most of them taken from ERC721.sol
    // Had issues using ERC721.sol originals
    // _transfer is slightly modified
    // There might be other changes in the future

    function balanceOf(address owner) public override view returns (uint256) {
        require(
            owner != address(0),
            "ERC721: balance query for the zero address"
        );

        return _holderTokens[owner].length();
    }

    function ownerOf(uint256 _position) public override view returns (address owner) {
        return
            _tokenOwners.get(
                _position,
                "ERC721: owner query for nonexistent token"
            );
    }

    function safeTransferFrom(address from, address to, uint256 _position)
        public
        override
        virtual
    {
        safeTransferFrom(from, to, _position, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 _position,
        bytes memory _data
    ) public override virtual {
        require(
            _isApprovedOrOwner(_msgSender(), _position),
            "ERC721: transfer caller is not owner nor approved"
        );
        _safeTransfer(from, to, _position, _data);
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 _position,
        bytes memory _data
    ) internal virtual {
        _transfer(from, to, _position);
        require(
            _checkOnERC721Received(from, to, _position, _data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    function transferFrom(address from, address to, uint256 _position) public override {
        require(
            _isApprovedOrOwner(_msgSender(), _position),
            "ERC721: transfer caller is not owner nor approved"
        );

        _transfer(from, to, _position);
    }

    function _transfer(address from, address to, uint256 _position)
        internal
        virtual
    {
        require(to != address(0), "ERC721: transfer to the zero address");

        if (from != address(0))
            require(
                ownerOf(_position) == from,
                "ERC721: transfer of token that is not own"
            );

        _beforeTokenTransfer(from, to, _position);

        //_approve(address(0), _position);

        if (from != address(0)) _holderTokens[from].remove(_position);

        _holderTokens[to].add(_position);

        _tokenOwners.set(_position, to);

        emit Transfer(from, to, _position);
    }

    function approve(address to, uint256 _position) public override virtual {
        address owner = ownerOf(_position);
        require(to != owner, "ERC721: approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, _position);
    }

    function _isApprovedOrOwner(address spender, uint256 _position)
        internal
        view
        returns (bool)
    {
        require(
            _exists(_position),
            "ERC721: operator query for nonexistent token"
        );
        address owner = ownerOf(_position);
        return (spender == owner ||
            getApproved(_position) == spender ||
            isApprovedForAll(owner, spender));
    }

    function getApproved(uint256 _position) public override view returns (address) {
        require(
            _exists(_position),
            "ERC721: approved query for nonexistent token"
        );
        return _tokenApprovals[_position];
    }

    function setApprovalForAll(address operator, bool approved) public override virtual {
        require(operator != _msgSender(), "ERC721: approve to caller");

        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator)
        public
        override
        view
        returns (bool)
    {
        return _operatorApprovals[owner][operator];
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) private returns (bool) {
        if (!to.isContract()) {
            return true;
        }
        (bool success, bytes memory returndata) = to.call(
            abi.encodeWithSelector(
                IERC721Receiver(to).onERC721Received.selector,
                _msgSender(),
                from,
                tokenId,
                _data
            )
        );
        if (!success) {
            if (returndata.length > 0) {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("ERC721: transfer to non ERC721Receiver implementer");
            }
        } else {
            bytes4 retval = abi.decode(returndata, (bytes4));
            return (retval == _ERC721_RECEIVED);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        virtual
    {}

    // Local helpers

    function supportsInterface(bytes4 interfaceID) public override view returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // ERC165
            interfaceID == _ERC721_INTERFACE || // ERC-721 on 3/7/2018
            interfaceID == _ERC721_INTERFACE_ENUMERABLE; // ERC721Enumerable
    }

    function validateHEXStr(string memory str) public pure returns (bool) {
        // https://ethereum.stackexchange.com/questions/50369/string-validation-solidity-alpha-numeric-and-length
        bytes memory b = bytes(str);
        if (b.length != 6) return false;

        for (uint256 i; i < b.length; i++) {
            bytes1 char = b[i];

            if (
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) && //a-z
                !(char == 0x2E) //.
            ) return false;
        }

        return true;
    }
}
