import logger from "@util/logger";
import Button from "./form/button";

export default class Notification {

  constructor({ parent, time, text, type, hash, scene }) {
    logger.log('Notification: constructor');

    this.text = text;
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

    let text;
    let icon;

    switch (this.type) {
      case 'processing':
        icon = `gg-loadbar-alt`;
        text = `Processing Tx ..`;
        break;
      case 'success':
        icon = `gg-check`;
        text = `Success`;
        break;
      case 'signature':
        icon = `gg-loadbar-alt`;
        text = `Signature request ..`;
        break;
      case 'error':
        icon = `gg-danger`;
        text = `Error`;
        break;
    }

    this.domElement.innerHTML = `<span class="icon"><i class="${icon}"></i></span>&nbsp;&nbsp; ${text}`;

    const elClasses = ['etherscan'];

    if (!this.hash)
      elClasses.push('disabled');

    if (this.type !== 'signature') {
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
    } else {
      this.domElement.innerHTML += `<div class="secondary-icon" tooltip="Confirm wallet ownership" flow="down"><i class="gg-pen"></i></div>`;
    }

    if (this.type === 'success' || this.type === 'error') {
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