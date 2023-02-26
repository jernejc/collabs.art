
import Web3 from 'web3';
import MetaMaskOnboarding from '@metamask/onboarding';

import { updateWorldImagePixelColors } from '@actions/pixel';

import config from '@util/config';
import { stringToBN, formatPosition, hexStringToColor, formatNetworkConfig } from '@util/helpers';
import logger from '@util/logger';

export default class Web3Manager {

  constructor(game, emitter) {
    logger.log('Web3Manager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.onboarding = new MetaMaskOnboarding();
    this.RPCinstance = null;
    this.tokenContract = null;
    this.canvasContract = null;
    this.minUnit = null;
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
    return (this.network && this.network.nativeCurrency) ? this.network.nativeCurrency.symbol : 'ETH';
  }

  async initProviders() {
    logger.log('Web3Manager: initProviders');

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
    logger.log('Web3Manager: initContracts');

    if (this.RPCinstance) {
      this.tokenContract = new this.RPCinstance.eth.Contract(
        config.contracts.token.abi,
        config.contracts.token.address
      );

      this.canvasContract = new this.RPCinstance.eth.Contract(
        config.contracts.canvas.abi,
        config.contracts.canvas.address
      );
    }

    if (this.websocketInstance) {
      this.eventTokenContract = new this.websocketInstance.eth.Contract(
        config.contracts.token.abi,
        config.contracts.token.address
      );

      this.eventCanvasContract = new this.websocketInstance.eth.Contract(
        config.contracts.canvas.abi,
        config.contracts.canvas.address
      );
    }
  }

  connectWebsocket() {
    logger.log('connectWebsocket');

    if (this.network.wsUrls && this.network.wsUrls.length > 0) {
      const options = {
        reconnect: {
          auto: true,
          delay: 5000, // ms
          maxAttempts: 5,
          onTimeout: true
        }
      };

      this.websocketInstance = new Web3(new Web3.providers.WebsocketProvider(this.network.wsUrls[0], options));
    }
  }

  enableProviderEvents() {
    logger.log('Web3Manager: enableProviderEvents');

    const _self = this; // Had to wrap them in anonymous functions to handle 'this'

    this.handleNewChainListener = chainId => _self.handleNewChain(chainId);
    this.handleNewNetworkListener = networkId => _self.handleNewNetwork(networkId);
    this.handleAccountsChangedListener = accounts => _self.handleAccountsChanged(accounts);

    // Provider events
    this.RPCinstance.currentProvider.on('accountsChanged', this.handleAccountsChangedListener);
    this.RPCinstance.currentProvider.on('chainChanged', this.handleNewChainListener);
    this.RPCinstance.currentProvider.on('networkChanged', this.handleNewNetworkListener);
    //this.RPCinstance.currentProvider.on('message', msg => _self.handleProviderMessage(msg));
  }

  enableContractEvents() {
    logger.log('Web3Manager: enableContractEvents');

    const _self = this;

    // Contract events
    if (this.websocketInstance) {
      this.colorPixelsListener = this.eventCanvasContract.events.ColorPixels({ fromBlock: 'latest' })
        .on('data', (e) => {
          logger.log('Web3Manager: ColorPixels')
          const _positions = e.returnValues.positions;
          const _colors = e.returnValues.colors;
          const _bids = e.returnValues.bids;

          const pixels = _positions.map((position, i) => {
            return {
              ...formatPosition(Web3.utils.hexToUtf8(Web3.utils.numberToHex(position))),
              color: hexStringToColor('#' + Web3.utils.hexToUtf8(_colors[i]))
            }
          });

          updateWorldImagePixelColors({ pixels, scene: this.game.scene.keys["MainScene"], updateTile: true })
        });


      this.transferTokenListener = this.eventTokenContract.events.Transfer({ fromBlock: 'latest' })
        .on('data', async (e) => {
          logger.log('Web3Manager: TransferToken');

          if (!e.returnValues || !e.returnValues.to || !e.returnValues.from || !e.returnValues.value) {
            logger.warn('Web3Manager: No return values found in event');
            return;
          }

          if (e.returnValues.to.toLowerCase() === this.activeAddress) {
            this.walletBalance += parseInt(Web3.utils.fromWei(e.returnValues.value));
            this.emitter.emit('web3/balance', this.walletBalance);
          } else if (e.returnValues.from.toLowerCase() === this.activeAddress) {
            this.walletBalance -= parseInt(Web3.utils.fromWei(e.returnValues.value));
            this.emitter.emit('web3/balance', this.walletBalance);
          }
        });
    }
  }

  handleDefaultNetwork() {
    logger.log('Web3Manager: handleDefaultNetwork');
    this.network = config.networks.find(net => net.default === true);

    this.connectWebsocket();
    this.initContracts();
    this.getMinUnit();
  }

  handleNewChain(chainId) {
    logger.log('Web3Manager: handleNewChain', chainId);
    const supported = config.networks.find(net => net.chainId == chainId && net.enabled === true);

    if (!supported) {
      logger.warn('Web3Manager: Chain ID not supported');
      this.chainId = null;
    } else
      this.chainId = chainId;
  }

  async handleNewNetwork(networkId) {
    logger.log('Web3Manager: handleNewNetwork', networkId);

    const supported = config.networks.find(net => net.id == networkId && net.enabled === true);

    if (!supported) {
      logger.warn('Web3Manager: Network ID not supported');
      this.network = null;
    } else
      this.network = supported;

    this.removeAllListeners();

    if (this.network) {
      this.connectWebsocket();
      this.initContracts();

      await this.getMinUnit();
      await this.getWalletBalance();

      this.enableContractEvents();
    }

    this.emitter.emit('web3/network', this.network);
  }

  async handleAccountsChanged(accounts) {
    logger.log('Web3Manager: handleAccountsChanged');

    if (accounts.length > 0) {
      this.accounts = accounts;
      this.activeAddress = accounts[0];

      await this.getWalletBalance();

      if (this.onboarding)
        this.onboarding.stopOnboarding();
    } else {
      this.accounts = [];
      this.activeAddress = null;
    }

    this.emitter.emit('web3/address', this.activeAddress);
  }

  handleProviderMessage(msg) {
    logger.log('handleProviderMessage', msg);
  }

  async ownerOf(_position) {
    logger.log('Web3Manager: ownerOf');

    if (typeof _position === 'string')
      _position = stringToBN(_position);

    let owner = null;

    try {
      owner = await this.canvasContract.methods.ownerOf(_position).call();
    } catch (error) {
      logger.warn('No owner found', error);
    }

    return owner;
  }

  async getNetworkAndChainId() {
    logger.log('Web3Manager: getNetworkAndChainId');

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
      logger.error(err)
    }
  }

  async requestAccounts() {
    logger.log('Web3Manager: requestAccounts');

    const accounts = await this.RPCinstance.currentProvider.request({
      method: 'eth_requestAccounts',
    });

    await this.handleAccountsChanged(accounts);

    return;
  }

  async getAccounts() {
    logger.log('Web3Manager: getAccounts');

    const accounts = await this.RPCinstance.currentProvider.request({
      method: 'eth_accounts',
    });

    this.handleAccountsChanged(accounts);

    return this.accounts;
  }

  async addNetwork(networkConfig) {
    logger.log('Web3Manager: addNetwork');

    let { id, enabled, ...chainConfig } = networkConfig;

    try {
      await this.RPCinstance.currentProvider.request({
        method: 'wallet_addEthereumChain',
        params: [formatNetworkConfig(chainConfig)]
      });
    } catch (error) {
      logger.error('Failed to add network to provider: ', error);
    }
  }

  async switchToNetwork() {
    logger.log('Web3Manager: switchToNetwork');

    //chainId = chainId || Web3.utils.toHex('5777') // Default to Development testnet

    const networkConfig = config.networks.find(net => net.default === true);

    if (!networkConfig)
      throw new Error('Unsupported network.');

    try {
      await this.RPCinstance.currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }]
      });

      if (!this.activeAddress)
        await this.getActiveAddress();
    } catch (error) {
      if (error.code === 4902) { // Network was not found in Metamask
        logger.warn('Network not found in Metamask, adding new config.')
        await this.addNetwork(networkConfig);
      } else
        throw new Error('Failed to switch network: ', error);
    }
  }

  async getMinUnit() {
    logger.log('Web3Manager: getMinUnit');

    let minUnit;

    try {
      minUnit = await this.canvasContract.methods.getMinUnit().call();
      this.minUnit = Web3.utils.fromWei(minUnit).toNumber();
    } catch (error) {
      logger.warn('Failed to fetch RPC minUnit');

      try {
        minUnit = await this.eventCanvasContract.methods.getMinUnit().call();
        this.minUnit = Web3.utils.fromWei(minUnit).toNumber();
      } catch (error) {
        logger.warn('Failed to fetch WS minUnit');
        this.minUnit = config.defaultMinUnit;
      }
    }

    return this.minUnit;
  }

  async getWalletBalance() {
    logger.log('Web3Manager: getWalletBalance');

    if (!this.activeAddress || !this.tokenContract)
      return;

    let balance;

    try {
      balance = await this.tokenContract.methods.balanceOf(this.activeAddress).call();
      this.walletBalance = parseInt(Web3.utils.fromWei(balance));
    } catch (error) {
      logger.error('Failed to fetch RPC balance', error);

      try {
        balance = await this.eventTokenContract.methods.balanceOf(this.activeAddress).call();
        this.walletBalance = parseInt(Web3.utils.fromWei(balance));
      } catch (error) {
        logger.error('Failed to fetch WS balance', error);
        this.walletBalance = 0;
      }
    }

    return this.walletBalance;
  }

  async getActiveAddress() {
    logger.log('Web3Manager: getActiveAddress');

    if (this.activeAddress)
      return this.activeAddress;

    // Request account connection
    await this.requestAccounts();

    if (this.activeAddress)
      return this.activeAddress;
    else
      throw new Error('No activeAddress found');
  }

  async preWeb3ActionSequence() {

    if (!this.hasMetamask) {
      this.onboarding.startOnboarding();
      return;
    }

    if (!this.isConnected)
      await this.switchToNetwork();

    if (!this.activeAddress)
      await this.getActiveAddress();

    if (!this.activeAddress)
      return false;

    return true;
  }

  async getEstimatedGasFees(speed) {
    let gasFees = {
      maxPriorityFeePerGas: Web3.utils.toWei('40', 'gwei'),
      maxFeePerGas: Web3.utils.toWei('40', 'gwei'),
    }

    const response = await fetch('https://gasstation-mainnet.matic.network/v2');
    const data = await response.json();

    if (data) {
      if (data[speed]) {
        gasFees.maxPriorityFeePerGas = Web3.utils.toWei(this.formatGasPrice(data[speed].maxPriorityFee), 'gwei');
        gasFees.maxFeePerGas = Web3.utils.toWei(this.formatGasPrice(data[speed].maxFee), 'gwei');
      } else if (data.standard) {
        gasFees.maxPriorityFeePerGas = Web3.utils.toWei(this.formatGasPrice(data.standard.maxPriorityFee), 'gwei');
        gasFees.maxFeePerGas = Web3.utils.toWei(this.formatGasPrice(data.standard.maxFee), 'gwei');
      }
    }
    
    return gasFees;
  }

  formatGasPrice(price) {
    return price.toFixed(8).toString()
  }

  removeAllListeners() {
    if (this.colorPixelsListener)
      this.colorPixelsListener.removeAllListeners('data');
  }
}