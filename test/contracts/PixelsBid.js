
const expect = require("chai").expect;
const duration = require("../helpers/duration");

const PixelsBid = artifacts.require("PixelsBid");
const Pixels = artifacts.require("Pixels");

contract("PixelsBid tests", async accounts => {

  const _color = web3.utils.stringToHex("FFFFFF");
  const _position = "10010";
  const _price = 2000000;
  const _defaultPrice = 1000000;
  const _contractFee = 10000;

  let instance, PixelsContractInstance;

  beforeEach(async () => {
    instance = await PixelsBid.deployed();

    const PixelsContractAddress = await instance.PixelsContract();
    PixelsContractInstance = await Pixels.at(PixelsContractAddress);
  });

  it("check defaultPrice", async () => {
    const defaultPrice = await instance.defaultPrice();
    expect(defaultPrice.toNumber()).to.equal(_defaultPrice, "Default buy price should be 100");
  });

  it("create and purchase a non existing pixel", async () => {
    try {
      const NonExistingPixel = await PixelsContractInstance.exists(_position);
      expect(NonExistingPixel).to.equal(false, "NonExistingPixel pixel should not exist");

      await instance.purchase(_position, _color, { value: _price });

      const NewPixelExists = await PixelsContractInstance.exists(_position);
      expect(NewPixelExists).to.equal(true, "Newly created pixel should exist");

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
        await instance.purchase(_position, _color, { from: accounts[1], value: _price });
      } catch (error) {
        expect(error.reason).to.equal("PixelsBid: You can only purchase a non-existing pixel");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("place bid on existing pixel", async () => {
    try {
      const ExistingPixel = await PixelsContractInstance.exists(_position);
      expect(ExistingPixel).to.equal(true, "ExistingPixel pixel should exist");

      await instance.placeBid(_position, duration.days(1), { from: accounts[1], value: _price });

      const pixelBid = await instance.getBidForPixel(_position);

      expect(pixelBid[1].toNumber()).to.equal(_price);
      expect(pixelBid[0]).to.equal(accounts[1]);

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
        await instance.placeBid(_position, duration.days(1), { from: accounts[1], value: _price - 1000 });
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
        await instance.placeBid("03434", duration.days(1), { from: accounts[1], value: _price });
      } catch (error) {
        expect(error.reason).to.equal("PixelsBid: Pixel position must exist");
      }
      
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

});