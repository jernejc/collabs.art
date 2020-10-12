const expect = require('chai').expect;
const truffleAssert = require('truffle-assertions');

const PixelsBuy = artifacts.require("PixelsBuy");
const Pixels = artifacts.require("Pixels");

contract("PixelsBuy tests", async accounts => {

  it("return PixelsBuy instance", async () => {
    const instance = await PixelsBuy.deployed();

    expect(instance.address.length).to.above(0);
  });

  it("purchase a non existing pixel", async () => {
    const _position = '9010';
    const _color = 'FFFFFF';
    const _price = 2000;
    const instance = await PixelsBuy.deployed();

    try {
      const currentPrice = await instance.currentPrice();
      expect(currentPrice.toNumber()).to.equal(100, 'Default buy price should be 100');

      const PixelsContractAddress = await instance.PixelsContract();
      const PixelsContractInstance = await Pixels.at(PixelsContractAddress);
      expect(PixelsContractAddress).to.equal(PixelsContractInstance.address, 'Contract address should equal instace contract address');

      const tx = await instance.purchasePosition(_position, _color, { value: _price });
      
      truffleAssert.eventEmitted(tx, 'Received', (e) => {
        expect(e.position.toString()).to.equal(_position, 'Recieved event position should match');
        expect(e.amount.toNumber()).to.equal(_price, 'Recieved event amount should match');

        return true;
      });

      const NewPixelExists = await PixelsContractInstance.exists(_position);
      expect(NewPixelExists).to.equal(true, 'Newly created pixel should exist');

    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });
});