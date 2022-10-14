import logger from "@util/logger";
import config from "@util/config";
import Button from "../form/button";

export default class AuctionInfo {

  constructor({ scene, parent, closed }) {
    logger.log('AuctionInfo: constructor');

    this.scene = scene;
    this.parent = parent;
    this.closed = closed || false;

    this.setupDom();
  }

  setupDom() {
    logger.log('AuctionInfo: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('info', 'auction-info');

    this.homeButton = new Button({
      icon: 'gg-home',
      text: 'Home',
      elClasses: ['action-button'],
      clickAction: () => {
        this.scene.game.tools.openOverlay();
        this.scene.game.tools.hideAuctionInfo();
      }
    });

    this.domElement.append(this.homeButton.domElement);

    this.documentationButton = new Button({
      icon: 'gg-file-document',
      text: 'Documentation',
      elClasses: ['action-button'],
      clickAction: () => {
        window.open(config.appConfig.docsLink, '_blank').focus();
      }
    });

    this.domElement.append(this.documentationButton.domElement);

    this.auctionPageButton = new Button({
      icon: 'gg-today',
      text: 'Auction page - soon!',
      disabled: true,
      elClasses: ['action-button']
    });

    this.domElement.append(this.auctionPageButton.domElement);

    /*this.closeBtn = document.createElement('i');
    this.closeBtn.classList.add('gg-close-r');
    this.domElement.append(this.closeBtn);

    this.closeListener = this.close.bind(this);
    this.closeBtn.addEventListener('click', this.closeListener);*/

    this.parent.append(this.domElement);

    if (this.closed)
      this.close();
  }

  close(e) {
    logger.log('AuctionInfo: close');

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!this.domElement.classList.contains('hidden'))
      this.domElement.classList.add('hidden');

    this.closed = true;
  }

  open() {
    logger.log('AuctionInfo: open');

    if (this.domElement.classList.contains('hidden'))
      this.domElement.classList.remove('hidden');

    this.closed = false;
  }

  destroy() {
    logger.log('AuctionInfo: destroy');

    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.closeListener);
      this.closeBtn = null;
    }

    this.parent.removeChild(this.domElement);
  }

}