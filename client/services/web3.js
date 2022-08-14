
import Web3 from 'web3';
import MetaMaskOnboarding from '@metamask/onboarding'

import config from '@util/config';

import { stringToBN, formatPosition, hexStringToColor, formatNetworkConfig } from '@util/helpers';

import { updateWorldImagePixelColors } from '@actions/pixel';

export default class Web3Manager {

  constructor(game, emitter) {
    if (DEBUG) console.log('Web3Manager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.onboarding = new MetaMaskOnboarding();
    this.RPCinstance = null;
    this.bidContract = null;
    this.pixelContract = null;
    this.defaultPrice = null;
    this.hasMetamask = false;
    this.accounts = [];
    this.activeAddress = null;
  }

  get isConnectedToRPC() {
    return this.RPCinstance && this.RPCinstance.currentProvider && this.RPCinstance.currentProvider.isConnected();
  }

  get isProviderConnected() {
    return this.RPCinstance && this.activeAddress;
  }

  get isNetworkConnected() {
    return this.chainId && this.network;
  }

  get isConnected() {
    return this.isConnectedToRPC && this.isNetworkConnected;
  }

  get currentStateTag() {
    let stateTag = null;

    if (!this.hasMetamask)
      stateTag = 'metamask';
    else if (!this.isConnected)
      stateTag = 'network';
    else if (!this.activeAddress)
      stateTag = 'wallet';
    else if (this.activeAddress)
      stateTag = 'address';

    return stateTag;
  }

  get currentSymbol() {
    return (this.network && this.network.nativeCurrency) ? this.network.nativeCurrency.symbol : 'MATIC';
  }

  async initProviders() {
    if (DEBUG) console.log('Web3Manager: initProviders');

    if (window.ethereum) {
      this.hasMetamask = true;
      this.RPCinstance = new Web3(window.ethereum);

      // Enable web3 related events
      this.enableProviderEvents();

      // Get network and chain data
      await this.getNetworkAndChainId();

      // Get connected accounts
      await this.getAccounts();
    }

    if (!this.network)
      this.handleDefaultNetwork();
  }

  initContracts() {
    if (DEBUG) console.log('Web3Manager: initContracts');

    if (this.RPCinstance) {
      this.bidContract = new this.RPCinstance.eth.Contract(
        config.contracts.bids.abi,
        config.contracts.bids.address
      );

      this.pixelContract = new this.RPCinstance.eth.Contract(
        config.contracts.pixels.abi,
        config.contracts.pixels.address
      );
    }

    if (this.websocketInstance) {
      this.eventBidContract = new this.websocketInstance.eth.Contract(
        config.contracts.bids.abi,
        config.contracts.bids.address
      );

      this.eventPixelContract = new this.websocketInstance.eth.Contract(
        config.contracts.pixels.abi,
        config.contracts.pixels.address
      );
    }
  }

  connectWebsocket() {
    if (this.network.wsUrls && this.network.wsUrls.length > 0)
      this.websocketInstance = new Web3(this.network.wsUrls[0]);
  }

  enableProviderEvents() {
    if (DEBUG) console.log('Web3Manager: enableProviderEvents');

    const _self = this; // Had to wrap them in anonymous functions to handle 'this'

    this.handleNewChainListener = chainId => _self.handleNewChain(chainId);
    this.handleNewNetworkListener = networkId => _self.handleNewNetwork(networkId);
    this.handleAccountsChangedListener = accounts => _self.handleAccountsChanged(accounts);

    // Provider events
    this.RPCinstance.currentProvider.on('chainChanged', this.handleNewChainListener);
    this.RPCinstance.currentProvider.on('networkChanged', this.handleNewNetworkListener);
    this.RPCinstance.currentProvider.on('accountsChanged', this.handleAccountsChangedListener);
    //this.RPCinstance.currentProvider.on('message', msg => _self.handleProviderMessage(msg));
  }

  enableContractEvents() {
    if (DEBUG) console.log('Web3Manager: enableContractEvents', this.pixelContract.events.ColorPixels());

    // Contract events
    if (this.websocketInstance) {
      this.socketColorPixelsListener = this.eventPixelContract.events.ColorPixels({ fromBlock: 'latest' })
        .on('data', (e) => {
          if (DEBUG) console.log('ColorPixels', e);
          const _positions = e.returnValues._positions;
          const _colors = e.returnValues._colors;

          const pixels = _positions.map((position, i) => {
            return {
              ...formatPosition(Web3.utils.hexToUtf8(Web3.utils.numberToHex(position))),
              color: hexStringToColor('#' + Web3.utils.hexToUtf8(_colors[i]))
            }
          });

          updateWorldImagePixelColors({ pixels, scene: this.game.scene.keys["MainScene"], updateTile: true })
        });
    }
  }

  handleDefaultNetwork() {
    if (DEBUG) console.log('Web3Manager: handleDefaultNetwork');
    this.network = config.networks.find(net => net.default === true);

    this.connectWebsocket();
    this.initContracts();
    this.getDefaultPrice();
  }

  handleNewChain(chainId) {
    /*if (DEBUG)*/ console.log('Web3Manager: handleNewChain', chainId);
    const supported = config.networks.find(net => net.chainId == chainId && net.enabled === true);

    if (!supported) {
      console.warn('Web3Manager: Chain ID not supported');
      this.chainId = null;
    } else
      this.chainId = chainId;
  }

  handleNewNetwork(networkId) {
    if (DEBUG) console.log('Web3Manager: handleNewNetwork', networkId);

    const supported = config.networks.find(net => net.id == networkId && net.enabled === true);

    if (!supported) {
      console.warn('Web3Manager: Network ID not supported');
      this.network = null;
    } else
      this.network = supported;

    this.removeAllListeners();

    if (this.network) {
      this.connectWebsocket();
      this.initContracts();
      this.getDefaultPrice();
      this.enableContractEvents();
    }

    this.emitter.emit('web3/network', this.network);
  }

  handleAccountsChanged(accounts) {
    if (DEBUG) console.log('Web3Manager: handleAccountsChanged', accounts);

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
      const chainId = await this.RPCinstance.currentProvider.request({
        method: 'eth_chainId',
      });

      this.handleNewChain(chainId)

      const networkId = await this.RPCinstance.currentProvider.request({
        method: 'net_version',
      });

      this.handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  async requestAccounts() {
    if (DEBUG) console.log('Web3Manager: requestAccounts');

    const accounts = await this.RPCinstance.currentProvider.request({
      method: 'eth_requestAccounts',
    });

    this.handleAccountsChanged(accounts);

    return;
  }

  async getAccounts() {
    if (DEBUG) console.log('Web3Manager: getAccounts');

    const accounts = await this.RPCinstance.currentProvider.request({
      method: 'eth_accounts',
    });

    this.handleAccountsChanged(accounts);

    return this.accounts;
  }

  async addNetwork(networkConfig) {
    if (DEBUG) console.log('Web3Manager: addNetwork');

    let { id, enabled, ...chainConfig } = networkConfig;

    try {
      await this.RPCinstance.currentProvider.request({
        method: 'wallet_addEthereumChain',
        params: [formatNetworkConfig(chainConfig)]
      });
    } catch (error) {
      console.error('Failed to add network to provider: ', error);
    }
  }

  async switchToNetwork(chainId) {
    /*if (DEBUG)*/ console.log('Web3Manager: switchToNetwork', chainId);

    chainId = chainId || Web3.utils.toHex('80001') // Default to  Polygon testnet

    const networkConfig = config.networks.find(net => net.chainId === chainId && net.enabled === true);

    if (!networkConfig)
      throw new Error('Unsupported network.');

    try {
      await this.RPCinstance.currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }]
      });

      /*await setTimeout(() => { }, 2000);

      if (!this.game.web3.activeAddress)
        await this.getActiveAddress();*/
    } catch (error) {
      if (error.code === 4902) { // Network was not found in Metamask
        console.warn('Network not found in Metamask, adding new config.')
        await this.addNetwork(networkConfig);
      } else
        throw new Error('Failed to switch network: ', error);
    }
  }

  async getDefaultPrice() {
    if (DEBUG) console.log('Web3Manager: getDefaultPrice');

    let defaultPrice;

    try {
      defaultPrice = await this.bidContract.methods.defaultPrice().call();
      this.defaultPrice = Web3.utils.fromWei(defaultPrice);
    } catch (error) {
      console.warn('Failed to fetch RPC default price');

      try {
        defaultPrice = await this.eventBidContract.methods.defaultPrice().call();
        this.defaultPrice = Web3.utils.fromWei(defaultPrice);
      } catch (error) {
        console.warn('Failed to fetch WS default price');
        this.defaultPrice = config.defaultPrice;
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

  removeAllListeners() {
    if (this.socketColorPixelsListener)
      this.socketColorPixelsListener.removeAllListeners('data');
  }
}