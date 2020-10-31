const expect = require('chai').expect;

const PixelsBid = artifacts.require("PixelsBid");
const Pixels = artifacts.require("Pixels");

contract("PixelsBid tests", async accounts => {

  const _color = web3.utils.stringToHex('FFFFFF');
  const _position = '10010';
  const _price = 2000;

  let instance, PixelsContractInstance;

  beforeEach(async () => {
    instance = await PixelsBid.deployed();

    const PixelsContractAddress = await instance.PixelsContract();
    PixelsContractInstance = await Pixels.at(PixelsContractAddress);
  });

  it("check defaultPrice", async () => {
    const defaultPrice = await instance.defaultPrice();
    expect(defaultPrice.toNumber()).to.equal(100, 'Default buy price should be 100');
  });

  it("purchase a non existing pixel", async () => {
    try {
      const NonExistingPixel = await PixelsContractInstance.exists(_position);
      expect(NonExistingPixel).to.equal(false, 'NonExistingPixel pixel should not exist');

      await instance.purchasePosition(_position, _color, { value: _price });

      const NewPixelExists = await PixelsContractInstance.exists(_position);
      expect(NewPixelExists).to.equal(true, 'Newly created pixel should exist');

    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });

  it("purchase an existing pixel", async () => {
    try {
      const ExistingPixel = await PixelsContractInstance.exists(_position);
      expect(ExistingPixel).to.equal(true, 'ExistingPixel pixel should exist');

      await instance.purchasePosition(_position, _color, { from: accounts[1], value: _price });

      const OwnerOf = await PixelsContractInstance.ownerOf(_position);
      expect(OwnerOf).to.equal(accounts[1], 'Owner of purchased pixel should be updated');

    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });
});