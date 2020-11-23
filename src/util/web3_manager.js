
import Web3 from 'web3';
import config from './config';

export default class Web3Manager {

  constructor() {
    this.web3 = null;
    this.bidContract = null;
    this.pixelContract = null;

    this.initProvider();
  }

  initProvider() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.providers.ganache));
    this.initContracts();
  }

  initContracts() {
    this.bidContract = new this.web3.eth.Contract(config.contracts.bids.abi, config.contracts.bids.address);
    this.pixelContract = new this.web3.eth.Contract(config.contracts.pixels.abi, config.contracts.pixels.address);
  }

}