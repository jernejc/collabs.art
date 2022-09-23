const HDWalletProvider = require('@truffle/hdwallet-provider');

const expect = require("chai").expect;
const BN = require('bn.js');
const { signERC2612Permit } = require('eth-permit');

const CollabToken = artifacts.require("CollabToken");

const rpcURL = 'http://localhost:7545'; // needs Ganache

contract("CollabToken tests", async accounts => {
  let tokenInstance;

  before(async () => {
    tokenInstance = await CollabToken.deployed();
  });

  it("should credit 1 ETH", async () => {
      try {
        // credit account[1] with some $PXT
        await tokenInstance.credit({ from: accounts[1], value: web3.utils.toWei('1', 'ether') });
  
        // Verify account balance
        const finalBalanceAccount1 = await tokenInstance.balanceOf(accounts[1]);
        expect(finalBalanceAccount1.toString()).to.equal(web3.utils.toWei('500', 'ether')); // $PXT tokens use the same decimals as ETH
        // Verify contract balance
        const finalBalanceContract = await web3.eth.getBalance(tokenInstance.address);
        expect(finalBalanceContract.toString()).to.equal(web3.utils.toWei('1', 'ether'));
      } catch (error) {
        console.error(error);
        assert.fail("One or more errors occured.");
      }
    });
  
    it("should withdraw 0.5 ETH", async () => {
      try {
        const initialBalanceContract = new BN(await web3.eth.getBalance(tokenInstance.address));
        const initialBalanceAccount0 = new BN(await web3.eth.getBalance(accounts[0]));
  
        // credit account[1] with some $PXT
        const response = await tokenInstance.withdraw(web3.utils.toWei('0.5', 'ether'));
  
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
        const finalBalanceContract = await web3.eth.getBalance(tokenInstance.address);
        expect(finalBalanceContract.toString()).to.equal(initialBalanceContract.sub(new BN(web3.utils.toWei('0.5', 'ether'))).toString());
      } catch (error) {
        console.error(error);
        assert.fail("One or more errors occured.");
      }
    });

  it("should permit 100 transfer", async () => {

    /** Create the new wallet */
    await web3.eth.accounts.wallet.create(1)
    const wallet = web3.eth.accounts.wallet[0]

    /** Bind the new wallet to the personal accounts */
    await web3.eth.personal.importRawKey(wallet.privateKey, '') // password is empty
    await web3.eth.personal.unlockAccount(wallet.address, '', 10000) // arbitrary duration

    // Need to user HDWallerProvider else "eth_signTypedData_v4" is not supported
    const provider = new HDWalletProvider({ privateKeys: [wallet.privateKey], provider: rpcURL });

    try {
      // Transfer some $COLAB to new provider account
      await tokenInstance.transfer(provider.addresses[0], web3.utils.toWei('10', 'ether'));

      const initialBalanceWalletProvider = await tokenInstance.balanceOf(provider.addresses[0]);
      const initialBalanceAccount4 = await tokenInstance.balanceOf(accounts[4]);

      // find the correct nonce to use with a query to the test network
      const nonce = await tokenInstance.nonces(provider.addresses[0]);
      const max_int = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      // create a wallet that will use a mainnet chainId for its provider but does not connect to anything
      // it will use the ethers.js _signTypedData to create the signature and not a wallet provider
      // check docs: https://github.com/dmihal/eth-permit#special-consideration-when-running-on-test-networks

      const domain = {
        "name": "CollabToken",
        "version": "1",
        "chainId": 1,
        "verifyingContract": tokenInstance.address
      }

      const result = await signERC2612Permit(provider, domain, provider.addresses[0], accounts[4], web3.utils.toWei('1', 'ether'), max_int, nonce);
      await tokenInstance.grant(provider.addresses[0], accounts[4], web3.utils.toWei('1', 'ether'), result.deadline, 'twitter:login', result.v, result.r, result.s, {
        from: accounts[4]
      });

      const finalBalanceWalletProvider = await tokenInstance.balanceOf(provider.addresses[0]);
      expect(finalBalanceWalletProvider.toString()).to.equal(initialBalanceWalletProvider.sub(new BN(web3.utils.toWei('1', 'ether'))).toString());
      const finalBalanceAccount4 = await tokenInstance.balanceOf(accounts[4]);
      expect(finalBalanceAccount4.toString()).to.equal(initialBalanceAccount4.add(new BN(web3.utils.toWei('1', 'ether'))).toString());
    } catch (error) {
      console.error(error);
      assert.fail("One or more errors occured.");
    }
  });
});