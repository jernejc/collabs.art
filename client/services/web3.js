
import Web3 from 'web3';
//import MetaMaskOnboarding from '@metamask/onboarding'

import config from '@util/config';
import { stringToBN } from '@util/helpers';

export default class Web3Manager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.instance = null;
    this.bidContract = null;
    this.pixelContract = null;
    this.defaultPrice = null;

    this.accounts = [];
    this.activeAddress = null;
  }

  async initProvider() {
    if (DEBUG) console.log('Web3Manager: initProvider');

    if (!window.ethereum)
      console.error('No Metamask'); //this.startOnboarding(); 
    else {
      this.instance = new Web3(window.ethereum);

      // Enable web3 related events
      this.enableEvents();

      // Get network and chain data
      await this.getNetworkAndChainId();

      // Init contracts if network received
      if (this.isNetworkConnected)
        this.initContracts();

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

  enableEvents() {
    if (DEBUG) console.log('Web3Manager: enableEvents');

    const _self = this; // Had to wrap them in anonymous functions to handle 'this'

    this.instance.currentProvider.on('chainChanged', chainId => _self.handleNewChain(chainId));
    this.instance.currentProvider.on('networkChanged', networkId => _self.handleNewNetwork(networkId));
    this.instance.currentProvider.on('accountsChanged', accounts => _self.handleAccountsChanged(accounts));
    this.instance.currentProvider.on('message', msg => _self.handleProviderMessage(msg));
  }

  handleNewChain(chainId) {
    if (DEBUG) console.log('Web3Manager: handleNewChain', chainId);
    this.chainId = chainId;
  }

  handleNewNetwork(networkId) {
    if (DEBUG) console.log('Web3Manager: handleNewNetwork', networkId);
    this.networkId = networkId;
  }

  handleAccountsChanged(accounts) {
    if (DEBUG) console.log('Web3Manager: handleAccountsChanged', this, accounts);

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

  isConnectedToRPC() {
    return this.instance && this.instance.currentProvider && this.instance.currentProvider.isConnected();
  }

  isProviderConnected() {
    return this.instance && this.activeAddress;
  }

  isNetworkConnected() {
    return this.chainId && this.networkId;
  }

  /*startOnboarding() {
    if (DEBUG) console.log('Web3Manager: startOnboarding');

    const currentUrl = new URL(window.location.href)
    const forwarderOrigin = currentUrl.hostname === 'localhost'
      ? 'http://localhost:9000'
      : undefined

    this.onboarding = new MetaMaskOnboarding({ forwarderOrigin })
    this.onboarding.startOnboarding();
  }*/

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

    if (!this.defaultPrice)
      this.defaultPrice = await this.bidContract.methods.defaultPrice().call();

    return Web3.utils.fromWei(this.defaultPrice);
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