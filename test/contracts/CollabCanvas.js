const expect = require("chai").expect;
const BN = require('bn.js');

const CollabCanvas = artifacts.require("CollabCanvas");
const CollabToken = artifacts.require("CollabToken");

contract("CollabCanvas coloring tests", async accounts => {
  let canvasInstance;
  let tokenInstance;

  // Some general defaults
  const position = web3.utils.utf8ToHex("PT232");
  const color = web3.utils.utf8ToHex("883992");
  const unsupportedColor = web3.utils.utf8ToHex("183992");
  const minUnit = web3.utils.toWei('1');
  const bid = new BN(minUnit);

  const positions = ["PT233", "PT234", "PT235", "PT236", "PT237"].map(item => web3.utils.utf8ToHex(item));
  const colors = ["883992", "883992", "883992", "883992", "883992"].map(item => web3.utils.stringToHex(item));
  const bids = [bid, bid, bid, bid, bid];
  const bidsSum = bids.reduce((a, b) => b.add(a), new BN(0)); // sum all bids, returns BN

  before(async () => {
    canvasInstance = await CollabCanvas.deployed();
    tokenInstance = await CollabToken.deployed();

    // account[0] already has $COLAB from constructing the contract
    // credit account[1] with some $COLAB
    await tokenInstance.credit({ from: accounts[1], value: web3.utils.toWei('0.5', 'ether') });
  });

  it("set pixel color", async () => {
    const initialBalanceAccount = await tokenInstance.balanceOf(accounts[0]);
    const initialBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);

    try {
      await canvasInstance.setColor(position, color, bid.toString());

      // Verfiy color is set
      const NewPixelColor = await canvasInstance.getColor(position);
      expect(web3.utils.numberToHex(NewPixelColor)).to.equal(color);
      // Verfiy pixe data
      const NewPixel = await canvasInstance.getPixel(position);
      expect(web3.utils.numberToHex(NewPixel.color)).to.equal(color);
      expect(NewPixel.owner).to.equal(accounts[0]);
      expect(NewPixel.bid.toString()).to.equal(bid.toString());
      // Verify account balance
      const finalBalanceAccount = await tokenInstance.balanceOf(accounts[0]);
      expect(finalBalanceAccount.toString()).to.equal(initialBalanceAccount.sub(bid).toString());
      // Verify contract balance
      const finalBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);
      expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.add(bid).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("set pixels colors", async () => {
    const initialBalanceAccount = await tokenInstance.balanceOf(accounts[0]);
    const initialBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);

    try {
      await canvasInstance.setColors(positions, colors, bids.map(item => item.toString()));

      // Verfiy color is set
      const NewPixelColor = await canvasInstance.getColor(positions[0]);
      expect(web3.utils.numberToHex(NewPixelColor)).to.equal(colors[0]);
      // Verify account balance
      const finalBalanceAccount = await tokenInstance.balanceOf(accounts[0]);
      expect(finalBalanceAccount.toString()).to.equal(initialBalanceAccount.sub(bidsSum).toString());
      // Verify contract balance
      const finalBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);
      expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.add(bidsSum).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("should detect colors lenght missmatch", async () => {
    const detectedError = "CollabCanvas: positions and colors length mismatch";

    try {
      await canvasInstance.setColors(positions, colors.filter((_, i) => i !== 0), bids.map(item => item.toString())); // remove first item from colors
    } catch (error) {
      expect(error.toString()).to.contain(detectedError);
    }
  })

  it("should detect bids lenght missmatch", async () => {
    const detectedError = "CollabCanvas: positions and bids length mismatch";

    try {
      await canvasInstance.setColors(positions, colors, bids.map(item => item.toString()).filter((_, i) => i !== 0)); // remove first item from bids
    } catch (error) {
      expect(error.toString()).to.contain(detectedError);
    }
  })

  it("should detect bids are too low", async () => {
    const detectedError = "CollabCanvas: All bids must be higher than existing";

    try {
      await canvasInstance.setColors(positions, colors, bids);
    } catch (error) {
      expect(error.toString()).to.contain(detectedError);
    }
  })

  it("should refund existing bids when new one is applied", async () => {
    const newBids = bids.map(item => item.add(new BN(minUnit)));
    const newBidsSum = newBids.reduce((a, b) => b.add(a), new BN(0));

    const initialBalanceAccount0 = await tokenInstance.balanceOf(accounts[0]);
    const initialBalanceAccount1 = await tokenInstance.balanceOf(accounts[1]);
    const initialBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);

    try {
      await canvasInstance.setColors(positions, colors, newBids.map(item => item.toString()), { from: accounts[1] });

      // Verify account0 balance 
      const finalBalanceAccount0 = await tokenInstance.balanceOf(accounts[0]);
      expect(finalBalanceAccount0.toString()).to.equal(initialBalanceAccount0.add(bidsSum).toString());
      // Verify account1 balance 
      const finalBalanceAccount1 = await tokenInstance.balanceOf(accounts[1]);
      expect(finalBalanceAccount1.toString()).to.equal(initialBalanceAccount1.sub(newBidsSum).toString());
      // Verify contract balance
      const finalBalanceContract = await tokenInstance.balanceOf(canvasInstance.address);
      expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.sub(bidsSum).add(newBidsSum).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  })

});