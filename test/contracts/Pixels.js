const expect = require('chai').expect;
const Pixels = artifacts.require("Pixels");

contract("Pixels tests", async accounts => {

  it("return Pixels instance", async () => {
    const instance = await Pixels.deployed();

    expect(instance.address.length).to.above(0);
  });

  it("create a new pixel", async () => {
    const _position = '1010';
    const _color = 'FFFFFF';
    const instance = await Pixels.deployed();

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      NewPixelExists = await instance.exists(_position);
      expect(NewPixelExists).to.equal(true, 'Newly created pixel should exist');
    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });

  it("exists fails on non existing pixel", async () => {
    const _position = '2010';
    const instance = await Pixels.deployed();

    try {
      NonExistingPixel = await instance.exists(_position);

      expect(NonExistingPixel).to.equal(false, 'Non existing pixel should not exist');
    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });

  it("get pixel color", async () => {
    const _position = '3010';
    const _color = 'FFFFFF';
    const instance = await Pixels.deployed();

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      PixelColor = await instance.getColor(_position);
      expect(PixelColor.toString()).to.equal(_color, 'Color should match');
    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });

  it("set pixel color", async () => {
    const _position = '4010';
    const _color = 'FFFFFF';
    const _new_color = '000000';
    const instance = await Pixels.deployed();

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      await instance.setColor(_position, _new_color);

      NewPixelColor = await instance.getColor(_position);
      expect(NewPixelColor.toString()).to.equal(_new_color, 'New color should match');
    } catch (error) {
      console.error(error);
      assert.fail('One or more errors occured.');
    }
  });

  it("fail to set color on invalid HEX", async () => {
    const _position = '5010';
    const _color = 'FFFFFF';
    const _new_color = '!00000';
    const instance = await Pixels.deployed();

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      await instance.setColor(_position, _new_color);
    } catch (error) {
      expect(error.reason).to.equal('Pixels: Must be a valid HEX color value');
    }
  });

});