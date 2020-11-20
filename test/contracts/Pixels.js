const expect = require("chai").expect;
const Pixels = artifacts.require("Pixels");

const _color = web3.utils.stringToHex("FFFFFF");

contract("Pixels tests", async accounts => {
  let instance;

  beforeEach(async () => {
    instance = await Pixels.deployed();
  });

  it("create a new pixel", async () => {
    const _position = 1010;

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      NewPixelExists = await instance.exists(_position);
      expect(NewPixelExists).to.equal(true, "Newly created pixel should exist");
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("exists fails on non existing pixel", async () => {
    const _position = "2010";

    try {
      NonExistingPixel = await instance.exists(_position);

      expect(NonExistingPixel).to.equal(false, "Non existing pixel should not exist");
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("get pixel color", async () => {
    const _position = "3010";

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      PixelColor = await instance.getColor(_position);
      expect(PixelColor.toString()).to.equal(_color, "Color should match");
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("set pixel color", async () => {
    const _position = "4010";
    const _new_color = web3.utils.fromUtf8("FFFAAA");

    try {
      await instance.createPixel(_position, _color, accounts[0]);

      await instance.setColor(_position, _new_color);

      NewPixelColor = await instance.getColor(_position);
      expect(NewPixelColor.toString()).to.equal(_new_color);
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("fail to set color on invalid HEX", async () => {
    const _position = "5010";
    const _new_color = web3.utils.fromUtf8("!00000");

    await instance.createPixel(_position, _color, accounts[0]);

    try {
      await instance.setColor(_position, _new_color);
    } catch (error) {
      expect(error.reason).to.equal("Pixels: Must be a valid HEX color value");
    }

    const _new_color2 = web3.utils.fromUtf8("00000!");

    try {
      await instance.setColor(_position, _new_color2);
    } catch (error) {
      expect(error.reason).to.equal("Pixels: Must be a valid HEX color value");
    }
  });

  it("fail to mint with non minter account", async () => {
    const _position = "6010";

    try {
      await instance.createPixel(_position, _color, accounts[1], { from: accounts[2] });
    } catch (error) {
      expect(error.reason).to.equal("Pixels: Restricted to minters.");
    }
  });

  it("mint with new minter account", async () => {
    const _position = "7010";

    try {
      try {
        await instance.addMinter(accounts[2], { from: accounts[2] });
      } catch (error) {
        expect(error.reason).to.equal("Pixels: Restricted to admins.");
      }

      await instance.addMinter(accounts[2]);
      await instance.createPixel(_position, _color, accounts[1], { from: accounts[2] });
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("set new maxPixels", async () => {
    try {
      const maxPixels = await instance.maxPixels();
      expect(maxPixels.toNumber()).to.equal(1000000)

      try {
        await instance.setMaxPixels(10, { from: accounts[1] });
      } catch (error) {
        expect(error.reason).to.equal("Pixels: Restricted to admins.");
      }

      await instance.setMaxPixels(10, { from: accounts[0] });

      const newMaxPixels = await instance.maxPixels();
      expect(newMaxPixels.toNumber()).to.equal(10);
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("fail to create pixel over max limit", async () => {
    const _position = "8010";
    const _position2 = "9010";

    try {
      const maxPixels = await instance.maxPixels();
      expect(maxPixels.toNumber()).to.equal(10)

      const totalSupply = await instance.totalSupply();
      expect(totalSupply.toNumber()).to.equal(5);

      try {
        await instance.setMaxPixels(totalSupply.toNumber(), { from: accounts[0] });
      } catch (error) {
        expect(error.reason).to.equal("Pixels: Max pixels must be greater than 0 and total current supply");
      }

      await instance.setMaxPixels(totalSupply.toNumber() + 1, { from: accounts[0] }); // Set max supply just over total current supply

      await instance.createPixel(_position, _color, accounts[0]); // Max supply reached.

      try {
        await instance.createPixel(_position2, _color, accounts[0]);
      } catch (error) {
        expect(error.reason).to.equal("Pixels: Cannot create more than max amount of pixels");
      }

    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

});