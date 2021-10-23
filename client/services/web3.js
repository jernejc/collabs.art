
import Web3 from 'web3';
//import MetaMaskOnboarding from '@metamask/onboarding'

import config from '@util/config';
import { stringToBN } from '@util/helpers';

export default class Web3Manager {

  constructor(game, emitter) {
    /*if (DEBUG)*/ console.log('Web3Manager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.instance = null;
    this.bidContract = null;
    this.pixelContract = null;
    this.defaultPrice = null;
    this.metamask = false;
    this.accounts = [];
    this.activeAddress = null;
  }

  get isConnectedToRPC() {
    return this.instance && this.instance.currentProvider && this.instance.currentProvider.isConnected();
  }

  get isProviderConnected() {
    return this.instance && this.activeAddress;
  }

  get isNetworkConnected() {
    return this.chainId && this.network;
  }

  get isConnected() {
    return this.isConnectedToRPC && this.isNetworkConnected;
  }

  get currentSymbol() {
    return (this.network) ? this.network.symbol : 'tMATIC';
  }

  async initProvider() {
    if (DEBUG) console.log('Web3Manager: initProvider');

    if (window.ethereum) {
      this.metamask = true;
      this.instance = new Web3(window.ethereum);

      // Enable web3 related events
      this.enableProviderEvents();

      // Get network and chain data
      await this.getNetworkAndChainId();

      // Init contracts if network received
      if (this.isNetworkConnected) {
        this.initContracts();
        this.getDefaultPrice();
        this.enableContractEvents();
      }

      // Get connected accounts
      await this.getAccounts();
    }
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

  enableProviderEvents() {
    if (DEBUG) console.log('Web3Manager: enableProviderEvents');

    const _self = this; // Had to wrap them in anonymous functions to handle 'this'

    // Provider events
    this.instance.currentProvider.on('chainChanged', chainId => _self.handleNewChain(chainId));
    this.instance.currentProvider.on('networkChanged', networkId => _self.handleNewNetwork(networkId));
    this.instance.currentProvider.on('accountsChanged', accounts => _self.handleAccountsChanged(accounts));
    //this.instance.currentProvider.on('message', msg => _self.handleProviderMessage(msg));
  }

  enableContractEvents() {
    if (DEBUG) console.log('Web3Manager: enableContractEvents', this.instance.eth);

    // Contract events
    this.pixelContract.events.ColorPixel({ fromBlock: this.instance.eth.blockNumber }).on('data', (event) => { /*if (DEBUG)*/ console.log('ColorPixel', event) });
    this.pixelContract.events.ColorPixels({ fromBlock: this.instance.eth.blockNumber }).on('data', (event) => { /*if (DEBUG)*/ console.log('ColorPixels', event) });
  }

  handleNewChain(chainId) {
    if (DEBUG) console.log('Web3Manager: handleNewChain', chainId);
    const supported = config.networks.find(net => net.chainId == chainId && net.enabled);

    if (!supported) {
      console.warn('Web3Manager: Chain ID not supported');
      this.chainId = null;
    } else
      this.chainId = chainId;
  }

  handleNewNetwork(networkId) {
    /*if (DEBUG)*/ console.log('Web3Manager: handleNewNetwork', networkId);

    const supported = config.networks.find(net => net.id == networkId && net.enabled);

    if (!supported) {
      console.warn('Web3Manager: Network ID not supported');
      this.network = null;
    } else
      this.network = supported;

    this.emitter.emit('web3/network', this.network);
  }

  handleAccountsChanged(accounts) {
    /*if (DEBUG)*/ console.log('Web3Manager: handleAccountsChanged', this, accounts);

    if (accounts.length > 0) {
      this.accounts = accounts;
      this.activeAddress = accounts[0];

      if (this.onboarding)
        this.onboarding.stopOnboarding();
    } else {
      this.accounts = [];
      this.activeAddress = null;
    }

    this.emitter.emit('web3/address', this.activeAddress);
  }

  handleProviderMessage(msg) {
    console.log('handleProviderMessage', msg);
  }

  async ownerOf(_position) {
    if (DEBUG) console.log('Web3Manager: ownerOf');

    if (typeof _position === 'string')
      _position = stringToBN(_position);

    let owner = null;

    try {
      owner = await this.pixelContract.methods.ownerOf(_position).call();
    } catch (error) {
      console.warn('No owner found', error);
    }

    return owner;
  }

  async getNetworkAndChainId() {
    if (DEBUG) console.log('Web3Manager: getNetworkAndChainId');

    try {
      const chainId = await this.instance.currentProvider.request({
        method: 'eth_chainId',
      });

      this.handleNewChain(chainId)

      const networkId = await this.instance.currentProvider.request({
        method: 'net_version',
      });

      this.handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  async requestAccounts() {
    if (DEBUG) console.log('Web3Manager: requestAccounts');

    const accounts = await this.instance.currentProvider.request({
      method: 'eth_requestAccounts',
    });

    this.handleAccountsChanged(accounts);

    return;
  }

  async getAccounts() {
    if (DEBUG) console.log('Web3Manager: getAccounts');

    const accounts = await this.instance.currentProvider.request({
      method: 'eth_accounts',
    });

    this.handleAccountsChanged(accounts);

    return this.accounts;
  }

  async getDefaultPrice() {
    if (DEBUG) console.log('Web3Manager: getDefaultPrice');

    if (!this.defaultPrice) {
      let defaultPrice;

      try {
        defaultPrice = await this.bidContract.methods.defaultPrice().call();
        this.defaultPrice = Web3.utils.fromWei(defaultPrice);
      } catch (error) {
        console.error('Failed to fetch default price: ' + error);
        console.warn('Falling back on hardcoded default value.')
        this.defaultPrice = 0.05
      }
    }

    return this.defaultPrice;
  }

  async getActiveAddress() {
    if (DEBUG) console.log('Web3Manager: getActiveAddress');

    if (this.activeAddress)
      return this.activeAddress;

    // Request account connection
    await this.requestAccounts();

    if (this.activeAddress)
      return this.activeAddress;
    else
      throw new Error('No activeAddress found');
  }
}