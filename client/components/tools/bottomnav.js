import logger from "@util/logger";
import config from "@util/config";

import { colorPixels } from '@actions/pixel';

import Button from "../form/button";
import { pushGTMEvent } from "@util/helpers";

export default class BottomNav {

  constructor({ game, parent, closed }) {
    logger.log('BottomNav: constructor');

    this.game = game;
    this.scene = this.game.scene.keys['MainScene'];
    this.parent = parent;
    this.closed = closed || false;

    this.setupDom();
  }

  setupDom() {
    logger.log('BottomNav: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'bottom-nav');

    this.domElement.classList.add('hidden');

    this.changesCount = document.createElement('div');
    this.changesCount.classList.add('changes-count', 'hidden');

    this.domElement.append(this.changesCount);

    this.clearSelection = new Button({
      elClasses: ['clear-selection', 'hidden'],
      icon: 'gg-trash',
      tooltip: 'Clear changes',
      tooltipFlow: 'left',
      clickAction: this.game.selection.clearAllSelection.bind(this.game.selection)
    });

    this.domElement.append(this.clearSelection.domElement);

    this.changesStatus = document.createElement('div');
    this.changesStatus.classList.add('changes-stats');

    this.domElement.append(this.changesStatus);

    this.applyBtn = new Button({
      elClasses: ['action-button', 'apply'],
      text: 'Apply',
      clickAction: this.applyBtnAction.bind(this)
    });

    this.domElement.append(this.applyBtn.domElement);
    this.parent.append(this.domElement);
  }

  async applyBtnAction() {
    logger.log(`BottomNav: applyBtnAction`);

    pushGTMEvent('bottomNavApplyBtn', 'applyBtnClick', this.scene);
    const isReady = await this.game.web3.preWeb3ActionSequence();

    if (!isReady)
      return;

    if (this.game.selection.activeFullBid > this.game.web3.walletBalance) {
      this.game.tools.showTokenInfo();
      this.game.tools.setNotification(10000, 'info', null, 'Insufficient $COLAB.');
      return;
    }

    await colorPixels({ scene: this.scene, selection: this.game.selection.activeSelection })
  }

  updateActiveChangesCount() {
    logger.log(`BottomNav: updateActiveChangesCount`);

    if (this.changesBounceTimer) {
      clearTimeout(this.changesBounceTimer);
      this.changesBounceTimer = null;
      this.changesCount.classList.remove('bounce7');
    }

    const activePixelsCount = this.game.selection.activeChangesCount;
    const activeFullBid = this.game.selection.activeFullBid;

    if (activePixelsCount > 0) {
      const tooltipText = `Max ${config.appConfig.maxChanges} changes at a time`;
      let toolTipClasses = "pixelsModified";

      if (this.game.selection.pixels.length > config.appConfig.maxChanges)
        toolTipClasses += " open";

      this.changesCount.innerHTML = `<span>${activePixelsCount}</span>`;
      this.changesStatus.innerHTML = `
        <span class="sumTotal">${activeFullBid} $COLAB</span>&nbsp;
        <span class="${toolTipClasses}" tooltip="${tooltipText}" tooltip-flow="up">
          (&nbsp;<b>${activePixelsCount}</b>&nbsp;modified&nbsp;)
        </span>`;

      this.showActiveChanges();

      if (!this.clearSelection.domElement.classList.contains('visible')) {
        this.clearSelection.domElement.classList.add('visible');
        this.clearSelection.domElement.classList.remove('hidden');
      }
    } else {
      this.hideActiveChanges();

      if (!this.clearSelection.domElement.classList.contains('hidden')) {
        this.clearSelection.domElement.classList.add('hidden');
        this.clearSelection.domElement.classList.remove('visible');
      }
    }

    if (!this.closed) {
      this.applyBtn.clearIcon();
      this.applyBtn.clearColors();
      this.applyBtn.clearTooltip();

      switch (this.game.web3.currentStateTag) {
        case 'metamask':
          this.applyBtn.setColor('orange');
          this.applyBtn.setToolTip('Install Metamask');
          this.applyBtn.setIcon('metamask-white.png', 'Apply');
          break;
        case 'network':
          this.applyBtn.setColor('white');
          this.applyBtn.setToolTip('Switch to Network');
          this.applyBtn.setIcon('polygon-matic-logo.svg', 'Apply');
          break;
        case 'wallet':
          this.applyBtn.setColor('blue');
          this.applyBtn.setToolTip('Connect to Wallet');
          this.applyBtn.setIcon('gg-link', 'Apply');
          break;
        default:
          this.applyBtn.setColor('polygon');
          this.applyBtn.setIcon('gg-check', 'Apply');

          if (this.game.tools.domNotification && this.game.tools.domNotification.type === 'processing')
            this.applyBtn.loading();
          else
            this.applyBtn.setDisabled(false);
      }
    }
  }

  showActiveChanges() {
    logger.log('BottomNav: showActiveChanges');
    const _self = this;

    this.open()

    if (!this.changesCount.classList.contains('visible')) {
      this.changesCount.classList.add('visible', 'bounce7');
      this.changesCount.classList.remove('hidden');

      this.changesBounceTimer = setTimeout(() => {
        _self.changesCount.classList.remove('bounce7');
      }, 1000);
    } else if (!this.changesCount.classList.contains('bounce7')) {
      this.changesCount.classList.add('bounce7');
      this.changesBounceTimer = setTimeout(() => {
        _self.changesCount.classList.remove('bounce7');
      }, 1000);
    }
  }

  hideActiveChanges() {
    logger.log('BottomNav: hideActiveChanges')
    this.close();

    if (!this.changesCount.classList.contains('hidden')) {
      this.changesCount.classList.add('hidden');
      this.changesCount.classList.remove('visible');
    }
  }

  close() {
    logger.log('BottomNav: close')

    if (!this.domElement.classList.contains('hidden'))
      this.domElement.classList.add('hidden');

    this.closed = true;
  }

  open() {
    logger.log('BottomNav: open')

    if (this.domElement.classList.contains('hidden'))
      this.domElement.classList.remove('hidden');

    this.closed = false;
  }

  destroy() {
    logger.log('BottomNav: destroy');

    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.closeListener);
      this.closeBtn = null;
    }

    this.parent.removeChild(this.domElement);
  }

}