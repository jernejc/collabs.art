import logger from "@util/logger";
import Button from "./form/button";

export default class Notification {

  constructor({ parent, time, text, type, hash, scene, message }) {
    logger.log('Notification: constructor');

    this.text = text;
    this.parent = parent;
    this.time = time || 0 // ms
    this.type = type;
    this.scene = scene;
    this.hash = hash || null;
    this.message = message || null;

    this.elapsedTime = 0;

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
        text = this.message || `Processing Tx ..`;
        break;
      case 'success':
        icon = `gg-check`;
        text = this.message || `Success`;
        break;
      case 'signature':
        icon = `gg-loadbar-alt`;
        text = this.message || `Signature request ..`;
        break;
      case 'warning':
        icon = `gg-block`;
        text = this.message || `Invalid request`;
        break;
      case 'error':
        icon = `gg-danger`;
        text = this.message || `Error`;
        break;
      case 'info':
        icon = `gg-info`;
        text = this.message;
        break;
    }

    this.domElement.innerHTML = `<span class="icon"><i class="${icon}"></i></span>&nbsp;&nbsp; <span class="text">${text}</span>`;

    const elClasses = ['etherscan'];

    if (!this.hash)
      elClasses.push('disabled');

    // Some types need additional icons
    if (this.type !== 'signature' && this.type !== 'warning' && this.type !== 'info') {
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
    } else if (this.type === 'signature') {
      this.domElement.innerHTML += `
        <div class="secondary-icon" tooltip="Confirm wallet ownership" flow="down">
          <i class="gg-pen"></i>
        </div>`;
    }

    // Close btn
    if (this.type === 'success' || this.type === 'error' || this.type === 'warning' || this.type === 'info') {
      this.closeBtn = new Button({
        icon: 'gg-close',
        clickAction: this.destroy.bind(this)
      });

      this.domElement.appendChild(this.closeBtn.domElement);
    }

    if (this.time > 0)
      this.timer = setTimeout(this.destroy.bind(this), this.time);

    this.parent.appendChild(this.domElement);

    // Message icon
    if (this.message && (this.type !== 'info')) {
      const icon = this.domElement.querySelector('span.icon');

      icon.setAttribute('tooltip', this.message);
      icon.setAttribute('flow', 'down');
      icon.classList.add('open');
    }
  }

  startInterval() {
    logger.log('Notification: setupDom');

    if (this.type !== 'processing')
      return;

    if (this.messageInterval)
      return;

    this.clearMessageInterval();

    this.messageInterval = setInterval(() => {
      const elapsedTime = parseInt(this.elapsedTime / 10); // react every 10s
      logger.log('Notification: messageInterval', elapsedTime);

      switch (elapsedTime) {
        case 1:
          this.domElement.querySelector('span.text').innerHTML = `Confirming ..`;
          break;
        case 2:
          this.domElement.querySelector('span.text').innerHTML = `In a minute ..`;
          break;
        case 4:
          this.domElement.querySelector('span.text').innerHTML = `A few minutes ..`;
          break;
      }

      this.elapsedTime++;
    }, 1000);
  }

  setTxHash(hash) {
    logger.log('Notification: setTxHash');

    this.hash = hash;
    this.etherscanBtn.domElement.classList.remove('disabled');

    this.startInterval();
  }

  getTxURL() {
    if (this.hash)
      return `${this.scene.game.web3.network.blockExplorerUrl}/tx/${this.hash}`;
  }

  clearMessageInterval() {
    logger.log('Notification: clearMessageInterval');

    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }
  
  clearTimer() {
    logger.log('Notification: clearTimer');

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    logger.log('Notification: destroy');

    this.clearTimer();
    this.clearMessageInterval();

    if (this.parent.contains(this.domElement))
      this.parent.removeChild(this.domElement);

    this.scene.game.tools.domNotification = null; // hacky, not cool
  }
}