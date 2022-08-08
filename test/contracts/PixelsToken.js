const expect = require("chai").expect;
const BN = require('bn.js');

const PixelsToken = artifacts.require("PixelsToken");

contract("PixelsToken tests", async accounts => {
  let pixelsTokenInstance;

  before(async () => {
    pixelsTokenInstance = await PixelsToken.deployed();
  });

  it("should credit 2 ETH", async () => {
    try {
      // credit account[1] with some $PXT
      await pixelsTokenInstance.credit({ from: accounts[1], value: web3.utils.toWei('2', 'ether') });

      // Verify account balance
      const finalBalanceAccount1 = await pixelsTokenInstance.balanceOf(accounts[1]);
      expect(finalBalanceAccount1.toString()).to.equal(web3.utils.toWei('1000', 'ether')); // tokens use the same decimals as ETH
      // Verify contract balance
      const finalBalanceContract = await web3.eth.getBalance(pixelsTokenInstance.address);
      expect(finalBalanceContract.toString()).to.equal(web3.utils.toWei('2', 'ether'));
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("should withdraw 2 ETH", async () => {
    try {
      const initialBalanceContract = await web3.eth.getBalance(pixelsTokenInstance.address);
      const initialBalanceAccount0 = await web3.eth.getBalance(accounts[0]);

      // credit account[1] with some $PXT
      await pixelsTokenInstance.withdraw(web3.utils.toWei('2', 'ether'));

      // Verify account balance
      const finalBalanceAccount0 = await web3.eth.getBalance(accounts[0]);
      expect(finalBalanceAccount0.toString()).to.equal(initialBalanceAccount0.add(new BN(web3.utils.toWei('2', 'ether'))).toString()); // tokens use the same decimals as ETH
      // Verify contract balance
      const finalBalanceContract = await web3.eth.getBalance(pixelsTokenInstance.address);
      expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.sub(new BN(web3.utils.toWei('2', 'ether'))).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
});