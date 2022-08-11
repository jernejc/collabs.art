const expect = require("chai").expect;
const BN = require('bn.js');

const PixelsToken = artifacts.require("PixelsToken");

contract("PixelsToken tests", async accounts => {
  let pixelsTokenInstance;

  before(async () => {
    pixelsTokenInstance = await PixelsToken.deployed();
  });

  it("should credit 1 ETH", async () => {
    try {
      // credit account[1] with some $PXT
      await pixelsTokenInstance.credit({ from: accounts[1], value: web3.utils.toWei('1', 'ether') });

      // Verify account balance
      const finalBalanceAccount1 = await pixelsTokenInstance.balanceOf(accounts[1]);
      expect(finalBalanceAccount1.toString()).to.equal(web3.utils.toWei('500', 'ether')); // $PXT tokens use the same decimals as ETH
      // Verify contract balance
      const finalBalanceContract = await web3.eth.getBalance(pixelsTokenInstance.address);
      expect(finalBalanceContract.toString()).to.equal(web3.utils.toWei('1', 'ether'));
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });

  it("should withdraw 0.5 ETH", async () => {
    try {
      const initialBalanceContract = new BN(await web3.eth.getBalance(pixelsTokenInstance.address));
      const initialBalanceAccount0 = new BN(await web3.eth.getBalance(accounts[0]));

      // credit account[1] with some $PXT
      const response = await pixelsTokenInstance.withdraw(web3.utils.toWei('0.5', 'ether'));

      // get gas used
      const gasUsed = new BN(response.receipt.gasUsed);

      // Get gas price
      const tx = await web3.eth.getTransaction(response.tx);
      const gasPrice = new BN(tx.gasPrice);
      const adjustedInitialBalanceAccount0 = initialBalanceAccount0.sub(gasUsed.mul(gasPrice));

      // Verify account balance
      const finalBalanceAccount0 = new BN(await web3.eth.getBalance(accounts[0]));
      expect(finalBalanceAccount0.toString()).to.equal(adjustedInitialBalanceAccount0.add(new BN(web3.utils.toWei('0.5', 'ether'))).toString());

      // Verify contract balance
      const finalBalanceContract = await web3.eth.getBalance(pixelsTokenInstance.address);
      expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.sub(new BN(web3.utils.toWei('0.5', 'ether'))).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
});