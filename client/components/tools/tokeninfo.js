import logger from "@util/logger";
import config from "@util/config";

import { creditToken, permitSignature, permitToken } from "@actions/general"

import Button from "../form/button";
import Input from "../form/input";
import { pushGTMEvent } from "@util/helpers";

export default class TokenInfo {

  constructor({ scene, parent, closed }) {
    logger.log('TokenInfo: constructor');

    this.scene = scene;
    this.parent = parent;
    this.closed = closed || false;

    this.setupDom();
  }

  setupDom() {
    logger.log('TokenInfo: setupDom');

    const _self = this;

    this.domElement = document.createElement('div');
    this.domElement.classList.add('info', 'colab-info');
    this.domElement.innerHTML = `Get $COLAB for FREE by connecting your Twitter account. Check out the Youtube tutorial <a href="${config.appConfig.docs.getColabYTLink}" target="_blank">(Link)</a>`;

    this.socialButtonsWrapper = document.createElement('div');
    this.socialButtonsWrapper.classList.add('social-buttons');

    this.domElement.append(this.socialButtonsWrapper);

    this.twitterButton = new Button({
      icon: 'twitter-logo.png',
      text: 'Connect',
      caption: '10 followers = 1 $COLAB',
      disabled: false,
      elClasses: ['action-button', 'social-connect', 'twitter'],
      clickAction: async () => {
        pushGTMEvent('connectTwitterBtn', 'twitterBtnClick', this.scene);
        const isReady = await this.scene.game.web3.preWeb3ActionSequence();

        if (!isReady)
          return;

        pushGTMEvent('connectTwitterBtn', 'twitterSignin', this.scene);
        await this.scene.game.firebase.twitterSigninPopup();

        if (!this.scene.game.firebase.idToken)
          return;

        const signatureData = await permitSignature({ scene: this.scene, token: this.scene.game.firebase.idToken });

        if (signatureData) {
          const response = await permitToken({ scene: this.scene, response: signatureData, grant: 'twitter:login' });

          if (response)
            await this.scene.game.firebase.updateTokens();
        }
      }
    });

    this.socialButtonsWrapper.append(this.twitterButton.domElement);

    this.discordButton = new Button({
      icon: 'discord-icon.png',
      text: 'Channel',
      elClasses: ['action-button', 'social-connect', 'discord'],
      clickAction: async () => {
        pushGTMEvent('discordBtn', 'discordBtnClick', this.scene);
        window.open(config.slideshow.discordLink, '_blank').focus();
      }
    });

    this.socialButtonsWrapper.append(this.discordButton.domElement);

    this.supportForm = {
      value: 25
    }

    this.supportHeader = document.createElement('h3');
    this.supportHeader.textContent = 'or support the project: ';

    this.domElement.append(this.supportHeader);

    this.supportInput = new Input(this.supportForm, 'value', {
      elClasses: ['input'],
      type: 'number',
      step: 25,
      min: 25,
      max: 9999,
      label: (this.scene.game.web3.network) ? this.scene.game.web3.network.nativeCurrency.symbol : 'MATIC',
      dynamicWidth: true,
      decimals: 0,
      onChange: async () => {
        _self.refreshTokenCalc()
      }
    });

    this.domElement.append(this.supportInput.domElement);

    this.tokenCalc = document.createElement('div');
    this.tokenCalc.classList.add('colab-calc');
    this.domElement.append(this.tokenCalc);

    this.creditButton = new Button({
      icon: 'gg-arrows-exchange-alt',
      text: 'Exchange',
      elClasses: ['action-button', 'credit-token'],
      clickAction: async () => {
        pushGTMEvent('creditBtn', 'creditBtnClick', this.scene);

        if (!await this.scene.game.web3.preWeb3ActionSequence())
          return;

        await creditToken({ scene: this.scene, value: this.supportInput.input.value });
      }
    });

    this.domElement.append(this.creditButton.domElement);

    this.closeBtn = document.createElement('i');
    this.closeBtn.classList.add('gg-close-r');
    this.domElement.append(this.closeBtn);

    this.closeListener = this.close.bind(this);
    this.closeBtn.addEventListener('click', this.closeListener);

    this.parent.append(this.domElement);

    this.refreshTokenCalc();

    if (this.closed)
      this.close();
  }

  refreshTokenCalc() {
    this.tokenCalc.innerHTML = `<i class="gg-arrows-exchange-alt"></i> ${parseInt(this.supportInput.input.value * 2)} $COLAB`;
  }

  close() {
    logger.log('TokenInfo: close')

    if (!this.domElement.classList.contains('hidden'))
      this.domElement.classList.add('hidden');

    this.closed = true;
    this.scene.game.tools.hideTokenInfo();
  }

  open() {
    logger.log('TokenInfo: open')

    if (this.domElement.classList.contains('hidden'))
      this.domElement.classList.remove('hidden');

    this.closed = false;
  }

  destroy() {
    logger.log('TokenInfo: destroy');

    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.closeListener);
      this.closeBtn = null;
    }

    this.parent.removeChild(this.domElement);
  }

}