
const expect = require("chai").expect;
const truffleAssert = require('truffle-assertions');

const duration = require("../helpers/duration");

const PixelsBid = artifacts.require("PixelsBid");
const Pixels = artifacts.require("Pixels");

contract("PixelsBid tests", async accounts => {

  const _position = web3.utils.utf8ToHex("PT404");
  const _amount = web3.utils.toWei("0.01");
  const _defaultPrice = web3.utils.toWei("0.005");
  const _contractFee = 10000;
  const _million = 1000000;

  let instance, PixelsContractInstance;

  beforeEach(async () => {
    instance = await PixelsBid.deployed();

    const PixelsContractAddress = await instance.PixelsContract();
    PixelsContractInstance = await Pixels.at(PixelsContractAddress);
  });

  it("check defaultPrice", async () => {
    const defaultPrice = await instance.defaultPrice();
    expect(defaultPrice.toString()).to.equal(_defaultPrice, "Default buy price should be " + _defaultPrice + " WEI");
  });

  it("create and purchase a non existing pixel", async () => {

    try {
      await instance.purchase([_position], { value: _amount });

      const NewPixelExists = await PixelsContractInstance.exists(_position);
      expect(NewPixelExists).to.equal(true, "Newly created pixel should exist");

      const contractBalance = await web3.eth.getBalance(instance.address);
      expect(contractBalance).to.equal(_amount);

      const owner = await PixelsContractInstance.ownerOf(_position);
      expect(owner).to.equal(accounts[0]);

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("create and purchase multiple pixel positions", async () => {

    const _positions = [web3.utils.utf8ToHex("PT504"), web3.utils.utf8ToHex("PT604"), web3.utils.utf8ToHex("PT704"), web3.utils.utf8ToHex("PT804")];
    const _positions_value = web3.utils.toBN(_amount).mul(web3.utils.toBN(_positions.length));

    try {
      const prePurchaseContractBalance = await web3.eth.getBalance(instance.address);

      await instance.purchase(_positions, { value: _positions_value.toString() });

      const contractBalance = await web3.eth.getBalance(instance.address);
      expect(contractBalance).to.equal(web3.utils.toBN(prePurchaseContractBalance).add(_positions_value).toString());

      for (let index = 0; index < _positions.length; index++) {
        const position = _positions[index];
        const owner = await PixelsContractInstance.ownerOf(position);
        expect(owner).to.equal(accounts[0]);
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("fail to purchase an existing pixel", async () => {
    try {
      const ExistingPixel = await PixelsContractInstance.exists(_position);
      expect(ExistingPixel).to.equal(true, "ExistingPixel pixel should exist");

      try {
        await instance.purchase([_position], { from: accounts[1], value: _amount });
      } catch (error) {
        expect(error.reason).to.equal("ERC721Batch: _mintBatch token already minted");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
  
  it("place bid on existing pixel", async () => {
    try {
      const preBidContractBalance = await web3.eth.getBalance(instance.address);
      const bidTransaction = await instance.placeBid(_position, duration.days(1), { from: accounts[1], value: _amount });
      const pixelBid = await instance.getBidForPixel(_position);

      expect(pixelBid[1].toString()).to.equal(_amount);
      expect(pixelBid[0]).to.equal(accounts[1]);

      // Check contract balance
      const afterBidContractBalance = await web3.eth.getBalance(instance.address);
      const expectedAfterBidContractBalance = web3.utils.toBN(preBidContractBalance).add(web3.utils.toBN(_amount));

      expect(expectedAfterBidContractBalance.toString()).to.equal(afterBidContractBalance);

      // Check for BidCreated event
      truffleAssert.eventEmitted(bidTransaction, 'BidCreated', ev => {
        return web3.utils.hexToUtf8(web3.utils.toHex(ev._position)) === web3.utils.hexToUtf8(_position) &&
          ev._bidder === accounts[1] &&
          ev._amount.toString() === _amount
      });

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("fail to place bid with price 0", async () => {
    try {

      try {
        await instance.placeBid(_position, duration.days(1), { from: accounts[1], value: 0 });
      } catch (error) {
        expect(error.reason).to.equal("PixelsBid: Bid amount should be greater than 0 or currently highest bid");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  
  it("fail to place bid with price lower than existing bid", async () => {
    try {

      try {
        await instance.placeBid(_position, duration.days(1), { from: accounts[1], value: _amount - 1000 });
      } catch (error) {
        expect(error.reason).to.equal("PixelsBid: Bid amount should be greater than 0 or currently highest bid");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("fail to place bid on non-existing pixel", async () => {
    try {

      try {
        await instance.placeBid(web3.utils.toBN("03434"), duration.days(1), { from: accounts[1], value: _amount });
      } catch (error) {
        expect(error.reason).to.equal("PixelsBid: Pixel position must exist");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
  
  it("place higher bid on pixel with existing bid", async () => {
    try {
      const newBidPrice = web3.utils.toBN(_amount).add(web3.utils.toBN(_amount));
      const preRefundBalance = await web3.eth.getBalance(accounts[1]); // save balance before refund
      const preRefundContractBalance = await web3.eth.getBalance(instance.address); // save balance before refund
      const bidTransaction = await instance.placeBid(_position, duration.days(1), { from: accounts[2], value: newBidPrice.toString() }); // place new bid for pixel
      const pixelBid = await instance.getBidForPixel(_position); // get new bid

      expect(pixelBid[1].toString()).to.equal(newBidPrice.toString());
      expect(pixelBid[0]).to.equal(accounts[2]);

      // Make sure the existing bid was refunded
      const afterRefundBalance = await web3.eth.getBalance(accounts[1]); // get account balance after bid is placed
      const expectedAfterRefundBalance = web3.utils.toBN(preRefundBalance).add(web3.utils.toBN(_amount));

      expect(expectedAfterRefundBalance.toString()).to.equal(afterRefundBalance);

      // Check contract balance
      const afterRefundContractBalance = await web3.eth.getBalance(instance.address); // get contract address after bid
      const expectedAfterRefundContractBalance = web3.utils.toBN(preRefundContractBalance).add(web3.utils.toBN(_amount)); // event tho the new bid is 2x amount, we have to refund the original bid

      expect(expectedAfterRefundContractBalance.toString()).to.equal(afterRefundContractBalance);

      // Check for BidCreated event
      truffleAssert.eventEmitted(bidTransaction, 'BidCreated', ev => {
        return web3.utils.hexToUtf8(web3.utils.toHex(ev._position)) === web3.utils.hexToUtf8(_position) &&
          ev._bidder === accounts[2] &&
          ev._amount.toString() === newBidPrice.toString()
      });

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("accept the highest bid for given pixel", async () => {
    try {
      const oldOwner = await PixelsContractInstance.ownerOf(_position);
      expect(oldOwner).to.equal(accounts[0]); // make sure the default account is the current owner

      const pixelBid = await instance.getBidForPixel(_position);
      const bidAmount = pixelBid[1].toString();

      const preAcceptanceContractBalance = await web3.eth.getBalance(instance.address); // save balance of contract before bid is accepted

      await PixelsContractInstance.setApprovalForAll(instance.address, true); // contract needs to be approved for transfer
      const acceptTransaction = await instance.acceptBid(_position, { from: oldOwner });

      const newOwner = await PixelsContractInstance.ownerOf(_position);
      expect(newOwner).to.equal(pixelBid[0]);

      const contractFee = web3.utils.toBN(bidAmount).mul(web3.utils.toBN(_contractFee)).div(web3.utils.toBN(_million));
      const ownerFee = web3.utils.toBN(bidAmount).sub(contractFee);

      // Check for BidAccepted event
      truffleAssert.eventEmitted(acceptTransaction, 'BidAccepted', ev => {
        return web3.utils.hexToUtf8(web3.utils.toHex(ev._position)) === web3.utils.hexToUtf8(_position) &&
          ev._bidder === newOwner &&
          ev._seller === oldOwner &&
          ev._amount.toString() === ownerFee.toString() &&
          ev._fee.toString() === contractFee.toString()
      });

      const afterAcceptanceContractBalance = await web3.eth.getBalance(instance.address);
      expect(afterAcceptanceContractBalance).to.equal(web3.utils.toBN(preAcceptanceContractBalance).sub(ownerFee).toString());

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
});