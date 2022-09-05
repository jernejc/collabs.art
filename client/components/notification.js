import logger from "@util/logger";
import Button from "./form/button";

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

    switch (this.type) {
      case 'processing':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-loadbar-alt"></i></span>&nbsp;&nbsp; Processing Tx ..`;
        break;
      case 'success':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-check"></i></span>&nbsp;&nbsp; Success`;
        break;
      case 'error':
        this.domElement.innerHTML = `<span class="icon"><i class="gg-danger"></i></span>&nbsp;&nbsp; Error`;
        break;
    }

    const elClasses = ['etherscan'];

    if (!this.hash)
      elClasses.push('disabled');

    this.etherscanBtn = new Button({
      elClasses,
      icon: 'etherscan-logo.svg',
      clickAction: () => {
        let hashLink = this.getTxURL();

        if (hashLink)
          window.open(hashLink, '_blank').focus();
      }
    });

    this.domElement.appendChild(this.etherscanBtn.domElement);

    if (this.type !== 'processing') {
      this.closeBtn = new Button({
        icon: 'gg-close',
        clickAction: this.destroy.bind(this)
      });

      this.domElement.appendChild(this.closeBtn.domElement);
    }

    if (this.time > 0)
      this.timer = setTimeout(this.destroy.bind(this), this.time);

    this.parent.appendChild(this.domElement);
  }

  setTxHash(hash) {
    this.hash = hash;
    this.etherscanBtn.domElement.classList.remove('disabled');
  }

  getTxURL() {
    if (this.hash)
      return `${this.scene.game.web3.network.blockExplorerUrl}/tx/${this.hash}`;
  }

  destroy() {
    logger.log('Notification: destroy');

    this.parent.removeChild(this.domElement);
    this.scene.game.tools.domNotification = null; // hacky, not cool
  }
}