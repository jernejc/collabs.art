
import Web3 from 'web3';
import config from './config';
import { stringToBN } from './helpers';

export default class Web3Manager {

  constructor() {
    if (DEBUG) console.log('Web3Manager: constructor');

    this.instance = null;
    this.bidContract = null;
    this.pixelContract = null;

    this.initProvider();
  }

  initProvider() {
    if (DEBUG) console.log('Web3Manager: initProvider');

    this.instance = new Web3(
      new Web3.providers.HttpProvider(config.provider.http)
    );

    console.log('http provider', config.provider.http)

    this.initContracts();
  }

  initContracts() {
    if (DEBUG) console.log('Web3Manager: initContracts');

    this.bidContract = new this.instance.eth.Contract(
      config.contracts.bids.abi, 
      config.contracts.bids.address
    );

    this.pixelContract = new this.instance.eth.Contract(
      config.contracts.pixels.abi, 
      config.contracts.pixels.address
    );
  }

  async ownerOf(_position) {
    if (DEBUG) console.log('Web3Manager: ownerOf');

    if (typeof _position === 'string')
      _position = stringToBN(_position);

    let owner = null;

    try {
      console.log('Looking for owner of position: ' + _position);
      owner = await this.pixelContract.methods.ownerOf(_position).call();
      console.log('ownerOf _position is ' + owner);
    } catch (error) {
     console.warn('No owner found', error); 
    }

    return owner;
  }

  async getAccounts() {
    if (DEBUG) console.log('Web3Manager: getAccounts');

    if (!this.accounts) {
      const accounts = await this.instance.eth.getAccounts();
      console.log('ETH Accounts', accounts);

      this.accounts = accounts;
    }

    return this.accounts;
  }

  async currentDefaultAddress() {
    const accounts = await this.getAccounts();
    return accounts[0];
  }

}