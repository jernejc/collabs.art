
import { ethers } from "ethers";
import MetaMaskOnboarding from '@metamask/onboarding';

import { updateWorldImagePixelColors } from '@actions/pixel';

import config from '@util/config';
import { stringToBN, formatPosition, hexStringToColor, formatNetworkConfig, hexToString, numberToHex, delay } from '@util/helpers';
import logger from '@util/logger';

export default class Web3Manager {

  constructor(game, emitter) {
    logger.log('Web3Manager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.onboarding = new MetaMaskOnboarding();
    this.RPCProvider = null;
    this.tokenContract = null;
    this.canvasContract = null;
    this.minUnit = null;
    this.hasMetamask = false;
    this.accounts = [];
    this.activeAddress = null;
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

    if (typeof window.ethereum !== 'undefined') {
      try {
        this.hasMetamask = true;
        this.RPCProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        this.originalProvider = window.ethereum;

        this.isConnectedToRPC = await this.RPCProvider.ready;

        // Enable web3 related events
        this.enableProviderEvents();

        // Get network and chainsetNetworkAndChainId data
        await this.handleNewNetwork();

        // Connect websocket
        await this.connectWebsocket();
      } catch (error) {
        logger.error('Failed to connect to Metamask:', error);
      }
    }
  }

  initContracts() {
    logger.log('Web3Manager: initContracts');

    if (this.RPCProvider) {
      this.resetContracts();

      this.tokenContract = new ethers.Contract(
        config.contracts.token.address,
        config.contracts.token.abi,
        this.signer
      );

      this.canvasContract = new ethers.Contract(
        config.contracts.canvas.address,
        config.contracts.canvas.abi,
        this.signer
      );
    }
  }

  resetContracts() {
    logger.log('Web3Manager: resetContracts');

    if (this.tokenContract && this.canvasContract) {
      this.tokenContract.removeAllListeners();
      this.tokenContract = null;
      this.canvasContract.removeAllListeners();
      this.canvasContract = null;
    }
  }

  async connectWebsocket() {
    logger.log('Web3Manager: connectWebsocket');

    if (this.WSProvider)
      return;

    if (config.networkSettings.alchemy) {
      this.WSProvider = new ethers.providers.AlchemyWebSocketProvider('matic', config.networkSettings.alchemy);

      await this.WSProvider.ready;

      this.eventTokenContract = new ethers.Contract(
        config.contracts.token.address,
        config.contracts.token.abi,
        this.WSProvider
      );

      this.eventCanvasContract = new ethers.Contract(
        config.contracts.canvas.address,
        config.contracts.canvas.abi,
        this.WSProvider
      );

      this.enableContractEvents();
    }
  }

  enableProviderEvents() {
    logger.log('Web3Manager: enableProviderEvents');

    const _self = this; // Had to wrap them in anonymous functions to handle 'this'

    //this.handleNewChainListener = chainId => _self.handleNewChain(chainId);
    this.handleNewNetworkListener = networkId => _self.handleNewNetwork(networkId);
    this.handleAccountsChangedListener = accounts => _self.handleAccountsChanged(accounts);

    // Provider events
    this.originalProvider.on('accountsChanged', this.handleAccountsChangedListener);
    this.originalProvider.on('chainChanged', this.handleNewNetworkListener);
    //this.originalProvider.on('networkChanged', this.handleNewNetworkListener);
  }

  reload() {
    logger.log('Web3Manager: reload');

    if (this.network)
      window.location.reload();

    return;
  }

  enableContractEvents() {
    logger.log('Web3Manager: enableContractEvents');

    const _self = this;

    // Contract events
    if (this.eventCanvasContract) {
      this.eventCanvasContract.on('ColorPixels', (_positions, _colors, _bids) => {
        logger.log('Web3Manager: ColorPixels');

        const pixels = _positions.map((position, i) => {
          return {
            ...formatPosition(hexToString(numberToHex(position))),
            color: hexStringToColor('#' + hexToString(_colors[i]))
          }
        });

        updateWorldImagePixelColors({ pixels, scene: this.game.scene.keys["MainScene"], updateTile: true })
      });
    }

    if (this.eventTokenContract) {
      this.eventTokenContract.on('Transfer', async (from, to, value) => {
        logger.log('Web3Manager: TransferToken');

        if (!from || !to || !value) {
          logger.warn('Web3Manager: No return values found in event');
          return;
        }

        if (to.toLowerCase() === this.activeAddress) {
          this.walletBalance += parseInt(ethers.utils.formatUnits(value));
          this.emitter.emit('web3/balance', this.walletBalance);
        } else if (from.toLowerCase() === this.activeAddress) {
          this.walletBalance -= parseInt(ethers.utils.formatUnits(value));
          this.emitter.emit('web3/balance', this.walletBalance);
        }
      });
    }
  }

  async handleNewNetwork() {
    logger.log('Web3Manager: handleNewNetwork');

    await this.RPCProvider.getNetwork();
    
    const chainId = await this.RPCProvider.send("eth_chainId");
    const supported = config.networks.find(net => net.chainId == chainId && net.enabled === true);

    if (!supported) {
      logger.warn('Web3Manager: Network ID not supported');
      this.network = null;
      this.chainId = null;
      this.isNetworkConnected = false;

      this.network = config.networks.find(net => net.default === true);
    } else {
      this.isNetworkConnected = true;
      this.network = supported;
      this.chainId = supported.chainId;

      await this.RPCProvider.send("eth_requestAccounts", []);
      this.signer = this.RPCProvider.getSigner();

      this.initContracts();

      await this.getAccounts();
    }

    await this.getMinUnit();

    this.emitter.emit('web3/network', this.network);
  }

  async handleAccountsChanged(accounts) {
    logger.log('Web3Manager: handleAccountsChanged', accounts);

    if (accounts.length > 0) {
      this.accounts = accounts;
      this.activeAddress = accounts[0].toLowerCase();

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
      owner = await this.canvasContract.ownerOf(_position);
    } catch (error) {
      logger.warn('No owner found', error);
    }

    return owner;
  }

  async setNetworkAndChainId(network, init) {
    logger.log('Web3Manager: setNetworkAndChainId');

    try {
      await this.handleNewNetwork(network, init);
    } catch (err) {
      logger.error(err)
    }
  }

  async requestAccounts() {
    logger.log('Web3Manager: requestAccounts');

    const accounts = await this.RPCProvider.send("eth_requestAccounts", []);

    await this.handleAccountsChanged(accounts);

    return;
  }

  async getAccounts() {
    logger.log('Web3Manager: getAccounts');

    const accounts = await this.RPCProvider.listAccounts();

    await this.handleAccountsChanged(accounts);

    return this.accounts;
  }

  async addNetwork(networkConfig) {
    logger.log('Web3Manager: addNetwork');

    let { id, enabled, ...chainConfig } = networkConfig;

    try {
      await this.originalProvider.request({
        method: 'wallet_addEthereumChain',
        params: [formatNetworkConfig(chainConfig)]
      });
    } catch (error) {
      logger.error('Failed to add network to provider: ', error);
    }
  }

  async switchToNetwork() {
    logger.log('Web3Manager: switchToNetwork');

    const networkConfig = config.networks.find(net => net.default === true);

    if (!networkConfig)
      throw new Error('Unsupported network.');

    try {
      await this.originalProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }]
      });
    } catch (error) {
      if (error.code === 4902) { // Network was not found in Metamask
        logger.warn('Network not found in Metamask, adding new config.')
        await this.addNetwork(networkConfig);
      } else if (error.code === 4001) {
        logger.warn('User closed window.')
        return;
      } else
        throw new Error('Failed to switch network: ', error);
    }
  }

  async getMinUnit() {
    logger.log('Web3Manager: getMinUnit');

    let minUnit;

    try {
      minUnit = await this.canvasContract.getMinUnit();
      this.minUnit = ethers.utils.parseUnits(minUnit, "ether").toNumber();
    } catch (error) {
      logger.warn('Failed to fetch RPC minUnit');

      try {
        minUnit = await this.eventCanvasContract.getMinUnit();
        this.minUnit = ethers.utils.parseUnits(minUnit, "ether").toNumber();
      } catch (error) {
        logger.warn('Failed to fetch WS minUnit');
        this.minUnit = config.networkSettings.defaultMinUnit;
      }
    }

    return this.minUnit;
  }

  async getWalletBalance() {
    logger.log('Web3Manager: getWalletBalance');

    if (!this.isNetworkConnected || !this.activeAddress)
      return;

    let balance;

    try {
      balance = await this.tokenContract.balanceOf(this.activeAddress);
      this.walletBalance = parseInt(ethers.utils.formatEther(balance));
    } catch (error) {
      logger.error('Failed to fetch RPC balance', error);
      await delay(1000);

      try {
        balance = await this.tokenContract.balanceOf(this.activeAddress);
        this.walletBalance = parseInt(ethers.utils.formatEther(balance));
      } catch (error) {
        logger.error('Failed to fetch RPC balance 2nd', error);
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

    if (!this.isNetworkConnected)
      await this.switchToNetwork();

    if (!this.isNetworkConnected)
      return false;

    if (!this.activeAddress)
      return false;

    return true;
  }

  async getEstimatedGasFees(speed) {
    let gasFees = {
      maxPriorityFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
      type: '0x2',
      gasLimit: null
    }

    const response = await fetch('https://gasstation-mainnet.matic.network/v2');
    const data = await response.json();

    if (data) {
      if (data[speed]) {
        if (data[speed].maxPriorityFee)
          gasFees.maxPriorityFeePerGas = ethers.utils.parseUnits(this.formatGasPrice(data[speed].maxPriorityFee), 'gwei');
        if (data[speed].maxFee)
          gasFees.maxFeePerGas = ethers.utils.parseUnits(this.formatGasPrice(data[speed].maxFee), 'gwei');
      } else if (data.standard) {
        if (data.standard.maxPriorityFee)
          gasFees.maxPriorityFeePerGas = ethers.utils.parseUnits(this.formatGasPrice(data.standard.maxPriorityFee), 'gwei');
        if (data.standard.maxFee)
          gasFees.maxFeePerGas = ethers.utils.parseUnits(this.formatGasPrice(data.standard.maxFee), 'gwei');
      }
    }

    return gasFees;
  }

  formatGasPrice(price) {
    return price.toFixed(8).toString()
  }
}