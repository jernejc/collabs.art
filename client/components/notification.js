import logger from "@util/logger";

export default class Notification {

  constructor({ parent, time, type, hash, scene }) {
    logger.log('Notification: constructor');

    this.parent = parent;
    this.time = time || 0 // ms
    this.type = type;
    this.scene = scene;
    this.hash = hash || null;

    this.setupDom();
  }

  setupDom() {
    logger.log('Notification: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('notification', this.type);

    const hashLink = (this.hash) ? this.getTxURL(this.hash) : '#';

    switch (this.type) {
      case 'processing':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-loadbar-alt"></i></span>&nbsp;&nbsp; Processing Tx .. 
          <a class="etherscan disabled" target="_blank" tooltip="View on Etherscan" flow="down">
            <img src="assets/images/icons/etherscan-logo.svg" width="25">
          </a>`;
        break;
      case 'success':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-check"></i></span>&nbsp;&nbsp; Success 
          <a href="${hashLink}" class="etherscan" tooltip="View on Etherscan" flow="down" target="_blank">
            <img src="assets/images/icons/etherscan-logo.svg" width="25">
          </a>`;
        break;
      case 'error':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-close"></i></span>&nbsp;&nbsp; Error 
          <a href="${hashLink}" class="etherscan" tooltip="View on Etherscan" flow="down" target="_blank">
            <img src="assets/images/icons/etherscan-logo.svg" width="25">
          </a>`;
        break;
    }


    if (this.time > 0)
      this.timer = setTimeout(this.destroy.bind(this), this.time);

    this.parent.appendChild(this.domElement);
  }

  setTxHash(hash) {
    const etherscanDom = this.domElement.querySelector('.etherscan');
    etherscanDom.setAttribute('href', this.getTxURL(hash));
    etherscanDom.classList.remove('disabled');
  }

  getTxURL(hash) {
    return `${this.scene.game.web3.network.blockExplorerUrl}/tx/${hash}`;
  }

  destroy() {
    logger.log('Notification: destroy');

    this.parent.removeChild(this.domElement);
    this.scene.game.tools.domNotification = null; // hacky, not cool
  }
}