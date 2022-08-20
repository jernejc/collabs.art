import logger from "@util/logger";
import Button from "./form/button";

export default class AuctionInfo {

  constructor({ parent, closed }) {
    logger.log('AuctionInfo: constructor');

    this.parent = parent;
    this.closed = closed || false;

    this.setupDom();
  }

  setupDom() {
    logger.log('AuctionInfo: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('info', 'auction-info');
    this.domElement.innerHTML = 'Every month a snapshot of the canvas is taken and auctioned off as an NFT. The collected funds are split between $COLAB owners used to color the final image. Canvas resets each time. <a href="#">(more)</a>';

    this.auctionPageButton = new Button({
      icon: 'gg-today',
      text: 'Auction page - soon!',
      disabled: true,
      elClasses: ['action-button']
    });

    this.domElement.append(this.auctionPageButton.domElement);

    this.closeBtn = document.createElement('i');
    this.closeBtn.classList.add('gg-close-r');
    this.domElement.append(this.closeBtn);

    this.closeListener = this.close.bind(this);
    this.closeBtn.addEventListener('click', this.closeListener);

    this.parent.append(this.domElement);
  }

  close() {
    logger.log('AuctionInfo: close');

    if (!this.domElement.classList.contains('hidden'))
      this.domElement.classList.add('hidden');
  }

  open() {
    logger.log('AuctionInfo: open');

    if (this.domElement.classList.contains('hidden'))
      this.domElement.classList.remove('hidden');
  }

  destroy() {
    logger.log('AuctionInfo: destroy');

    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.closeListener);
      this.closeBtn = null;
    }

    this.parent.removeChild(this.domElement)
  }

}