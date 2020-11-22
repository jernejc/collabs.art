
import Web3 from 'web3';

import config from './config';

export default class Web3Manager {

  constructor() {
    this.provider = null;
    this.bidContract = null;
    this.pixelContract = null;

    this.initProvider();
  }

  initProvider() {
    this.provider = new Web3.providers.HttpProvider('http://localhost:7545');
    this.initContracts();
  }

  initContracts() {
    this.bidContract = new web3.eth.Contract(config.contracts.bids.abi, config.contracts.bids.address);
    this.pixelContract = new web3.eth.Contract(config.contracts.pixels.abi, config.contracts.pixels.address);
  }

}