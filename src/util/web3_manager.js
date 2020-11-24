
import Web3 from 'web3';
import config from './config';

export default class Web3Manager {

  constructor() {
    this.instance = null;
    this.bidContract = null;
    this.pixelContract = null;

    this.initProvider();
  }

  initProvider() {
    this.instance = new Web3(new Web3.providers.HttpProvider(config.providers.ganache));
    this.initContracts();
  }

  initContracts() {
    this.bidContract = new this.instance.eth.Contract(config.contracts.bids.abi, config.contracts.bids.address);
    this.pixelContract = new this.instance.eth.Contract(config.contracts.pixels.abi, config.contracts.pixels.address);
  }

}