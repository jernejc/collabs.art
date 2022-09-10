
import MinimapScene from '@scenes/minimap';

import InfoBox from '@components/tools/infobox';
import Menu from '@components/tools/menu';
import Overlay from '@components/overlay';
import Timer from '@components/tools/timer';
import Button from '@components/form/button';
import TokenInfo from '@components/tools/tokeninfo';
import AuctionInfo from '@components/tools/auctioninfo';

import { formatShortAddress, getCookie } from '@util/helpers';
import logger from '@util/logger';

import Notification from '@components/notification';
import BottomNav from '@components/tools/bottomnav';

export default class ToolsManager {

  constructor(game, emitter) {
    logger.log('ToolsManager: constructor');

    this.game = game;
    this.emitter = emitter;
    this.infobox = null;

    setTimeout(() => { // canvas null in Firefox -_-
      this.parent = this.game.canvas.parentNode;
      this.addHeader();
      this.addConnectionStatus();
      this.addNetworkAlert();
      this.addBottomNav();
      this.addEventListeners();

      const overlayCookie = getCookie('no_overlay');

      if (!overlayCookie)
        this.openOverlay()
    }, 10);
  }

  get metamaskURL() {
    logger.log('ToolsManager: metamaskURL', navigator.userAgent);

    let url;

    if (navigator.userAgent.search('Mozilla') > -1)
      url = 'https://addons.mozilla.org/sl/firefox/addon/ether-metamask/'
    else if (navigator.userAgent.search('Chrome') > -1)
      url = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

    return url;
  }

  addEventListeners() {
    this.emitter.on('web3/network', async network => {
      logger.log('ToolsManager: on web3/network');

      this.setConnectionStatus();
      this.setNetworkAlert();
      this.bottomNav.updateActiveChangesCount();

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && this.infobox.domElement && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/address', async address => {
      logger.log('ToolsManager: on web3/address');

      this.setConnectionStatus();
      this.setNetworkAlert();
      this.bottomNav.updateActiveChangesCount();

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && this.infobox.domElement && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/purchase', async address => {
      logger.log('ToolsManager: on web3/purchase', address);

      if (this.menu && this.menu.activeTab === 'selection')
        this.menu.createSettings();

      // Update infobox UI if user address changes
      if (this.infobox && this.infobox.domElement && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/balance', async balance => {
      logger.log('ToolsManager: on web3/balance', balance);

      this.setConnectionStatus();
      this.bottomNav.updateActiveChangesCount();
    });

    this.emitter.on('selection/update', async update => {
      logger.log('ToolsManager: on selection/update');

      const pixels = this.game.selection.pixels;
      const pixel = (update && update[0] && update[0].position) ? update[0] : pixels[0];

      if (this.menu && !this.menu.closed) {
        if (!Array.isArray(update) || update.length === 1) {
          //this.menu.close();
          await this.openInfoBox({ pixel: pixel, scene: this.game.scene });
          return;
        }

        if (this.menu.activeTab === 'selection') {
          await this.menu.loadPixels();
          this.menu.createSettings();
        }
      } else {
        if (pixels.length > 0) {
          if (!this.infobox)
            await this.openInfoBox({ pixel: pixel, scene: this.game.scene });
          else {
            if (!this.infobox.domElement || !this.infobox.pixel || pixel.position !== this.infobox.pixel.position) {
              await this.openInfoBox({ pixel: pixel, scene: this.game.scene });
            } else { // only refresh ui, if it's same pixel
              await this.infobox.setUI();
            }
          }
        }
      }

      this.bottomNav.updateActiveChangesCount();
    })

    this.emitter.on('selection/clear', async () => {
      logger.log('ToolsManager: on selection/clear');

      if (this.menu)
        this.clearMenu();

      if (this.infobox)
        this.clearInfoBox();

      this.game.selection.clearRectangleSelection();
      this.bottomNav.updateActiveChangesCount();
    })

    this.emitter.on('graph/update', async pixel => {
      logger.log('ToolsManager: on graph/update');

      if (this.menu && !this.menu.closed)
        this.menu.createSettings();
      if (pixel.infobox)
        await pixel.infobox.setUI();
    })
  }

  async openMenu(activeTab) {
    logger.log('ToolsManager: openMenu');

    if (this.menu) {
      if (this.menu.closed)
        this.menu.open();
      else if (this.menu.loaded)
        this.clearMenu();
    } else {
      this.menu = new Menu({ parent: this.parent, game: this.game, activeTab });
      await this.menu.init();
    }

    this.bottomNav.updateActiveChangesCount();
  }

  async openInfoBox({ pixel }) {
    logger.log('ToolsManager: openInfoBox');

    if (this.infobox)
      this.clearInfoBox();

    this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, game: this.game });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  openOverlay() {
    logger.log('ToolsManager: openOverlay');

    if (this.overlay)
      this.clearOverlay();

    this.overlay = new Overlay({ parent: this.parent, game: this.game, close: this.clearOverlay.bind(this) });
  }

  showTokenInfo() {
    logger.log('ToolsManager: showTokenInfo');

    if (this.domTokenInfo && this.domTokenInfo.closed)
      this.domTokenInfo.open();

    if (this.connectionStatusInfo.classList.contains('hidden'))
      this.connectionStatusInfo.classList.remove('hidden');
  }

  hideTokenInfo() {
    logger.log('ToolsManager: hideTokenInfo');

    if (this.domTokenInfo && !this.domTokenInfo.closed)
      this.domTokenInfo.close();

    if (this.connectionStatusInfo && !this.connectionStatusInfo.classList.contains('hidden'))
      this.connectionStatusInfo.classList.add('hidden');
  }

  setConnectionStatus() {
    logger.log('ToolsManager: setConnectionStatus', this.game.web3.currentStateTag);

    let iconText = '';
    let iconClass = null;
    let action = null;
    let alertIcon = true;

    if (this.connectionStatusBtn.domElement.classList.contains('info-text-gray'))
      this.connectionStatusBtn.domElement.classList.remove('info-text-gray');

    switch (this.game.web3.currentStateTag) {
      case 'metamask':
        iconClass = 'metamask-white.png';
        action = this.game.web3.onboarding.startOnboarding;
        break;
      case 'network':
        iconClass = 'ethereum-logo.png';
        action = this.game.web3.switchToNetwork.bind(this.game.web3);
        break;
      case 'wallet':
        iconClass = 'gg-link';
        action = this.game.web3.getActiveAddress.bind(this.game.web3);
        break;
      case 'address':
        alertIcon = false;
        iconText = `${this.game.web3.walletBalance || 0} $COLAB`;
        action = this.showTokenInfo.bind(this);
        break;
      case 'permit':
        iconClass = 'gg-extension';
        action = this.game.web3.permitContractAllowance.bind(this.game.web3);
        break;
    }

    this.connectionStatusBtn.clearIcon();

    if (iconText) {
      this.connectionStatusBtn.setText(iconText);

      if (this.game.web3.walletBalance == 0) {
        if (!this.connectionStatusBtn.domElement.classList.contains('info-text-gray'))
          this.connectionStatusBtn.domElement.classList.add('info-text-gray');
      }
    }

    if (iconClass)
      this.connectionStatusBtn.setIcon(iconClass, null, alertIcon);
    if (action)
      this.connectionStatusBtn.setClickAction(action);
  }

  setNotification(time, type, hash) {
    logger.log('ToolsManager: setNotification');

    this.removeNotification();

    this.domNotification = new Notification({ parent: this.parent, scene: this.game.scene.keys['MainScene'], time, type, hash })
  }

  setNotificationTxHash(hash) {
    logger.log('ToolsManager: setNotificationTxHash');

    if (this.domNotification)
      this.domNotification.setTxHash(hash)
  }

  removeNotification() {
    logger.log('ToolsManager: removeNotification');

    if (this.domNotification)
      this.domNotification.destroy();
  }

  setNetworkAlert(text) {
    logger.log('ToolsManager: setNetworkAlert');

    text = text || null;

    if (!text) {
      switch (this.game.web3.currentStateTag) {
        case 'metamask':
          text = 'Install Metamask';
          break;
        case 'network':
          text = `Switch to Network`;
          break;
        case 'wallet':
          text = 'Connect to Wallet';
          break;
        case 'address':
          text = formatShortAddress(this.game.web3.activeAddress);
          break;
        case 'permit':
          text = 'Increase allowance';
          break;
      }
    }

    if (text) {
      this.networkAlert.innerHTML = text;
      this.networkAlert.classList.add('show');

      if (this.networkAlert.classList.contains('hide'))
        this.networkAlert.classList.remove('hide');
    }
    else {
      this.networkAlert.innerHTML = '';
      this.networkAlert.classList.add('hide');

      if (this.networkAlert.classList.contains('show'))
        this.networkAlert.classList.remove('show');
    }
  }

  addBottomNav() {
    logger.log('ToolsManager: addBottomNav');

    this.bottomNav = new BottomNav({
      game: this.game,
      parent: this.parent
    })
  }

  addHeader() {
    logger.log('ToolsManager: addHeader');

    this.header = document.createElement('div');
    this.header.setAttribute('id', 'header');

    this.headerIcon = new Button({
      elClasses: [],
      icon: 'gg-time' // <i class="gg-time"></i>
    });
    this.header.append(this.headerIcon.domElement);

    this.headerTimer = new Timer({ parent: this.header, game: this.game });

    this.domAuctionInfo = new AuctionInfo({ parent: this.header, closed: true });

    this.parent.append(this.header);

    this.header.addEventListener('click', (e) => {
      this.domAuctionInfo.open();
    });
  }

  addConnectionStatus() {
    logger.log('ToolsManager: addConnectionStatus');

    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'connection-status');

    this.connectionStatusBtn = new Button({
      elClasses: ['account', 'connection'],
      icon: 'gg-block'
    });

    this.domConnectionStatus.append(this.connectionStatusBtn.domElement);

    this.domTokenInfo = new TokenInfo({
      scene: this.game.scene.keys['MainScene'],
      parent: this.domConnectionStatus,
      closed: true
    });

    this.parent.append(this.domConnectionStatus);

    this.setConnectionStatus();
  }

  addNetworkAlert() {
    logger.log('ToolsManager: addNetworkAlert');

    if (!this.domConnectionStatus) {
      logger.warn('No connectino status DOM found. Skipping network alert');
      return;
    }

    this.networkAlert = document.createElement('div');
    this.networkAlert.setAttribute('id', 'alert');

    this.domConnectionStatus.prepend(this.networkAlert);

    this.networkAlert.addEventListener('click', (e) => {
      this.connectionStatusBtn.domElement.dispatchEvent(new Event('click', { 'bubbles': true }));
    });

    this.connectionStatusInfo = document.createElement('div');
    this.connectionStatusInfo.classList.add('more-info', 'hidden');
    this.connectionStatusInfo.setAttribute('tooltip', 'More info');
    this.connectionStatusInfo.setAttribute('flow', 'left');

    this.connectionStatusInfo.innerHTML = '<i class="gg-info"></i>';

    this.domConnectionStatus.prepend(this.connectionStatusInfo);

    this.setNetworkAlert();
  }

  addMinimap(scene) {
    logger.log("ToolsManager: addMinimap");

    scene = scene || this.game.scene;

    const sizeRatio = (window.devicePixelRatio > 1) ? 5 + (5 * 0.5 / window.devicePixelRatio) : 5;
    const margin = 7;
    const margin2X = margin + margin;

    // Minimap size
    const width = 1000 / sizeRatio;
    const height = 1000 / sizeRatio;

    // Minimap position
    const x = margin2X;
    const y = scene.appConfig.canvasHeight - (height + margin2X);

    this.minimapWrapper = scene.add.zone(
      x,
      y,
      width,
      height
    )
      .setInteractive()
      .setOrigin(0)
      .setDepth(3)

    this.minimapBackground = scene.add.rectangle(
      x - margin,
      y - margin,
      width + margin2X,
      height + margin2X, Phaser.Display.Color.HexStringToColor('#181a1b').color, 1
    )
      .setOrigin(0)
      .setDepth(2)

    scene.minimap = new MinimapScene({
      appConfig: scene.appConfig,
      sceneConfig: {
        gridWidth: scene.gridWidth,
        gridHeight: scene.gridHeight,
        size: scene.size,
        sizeRatio,
        margin,
        width,
        height,
        x,
        y
      }
    }, this.minimapWrapper);

    scene.scene.add('MinimapScene', scene.minimap, true);
  }

  hideTools() {
    logger.log('ToolsManager: hideTools');

    this.networkAlert.style.display = 'none';
    this.domConnectionStatus.style.overflow = 'hidden';
    this.connectionStatusBtn.domElement.style.display = 'none';
    this.header.style.display = 'none';

    this.bottomNav.domElement.classList.add('hidden');

    this.minimapWrapper.setVisible(false);
    this.minimapBackground.setVisible(false);
    this.game.scene.stop("MinimapScene");

    if (this.infobox)
      this.clearInfoBox();
    if (this.menu)
      this.clearMenu();
  }

  showTools() {
    logger.log('ToolsManager: showTools');

    this.networkAlert.style.display = 'flex';
    this.domConnectionStatus.style.overflow = 'visible';
    this.connectionStatusBtn.domElement.style.display = 'flex';
    this.header.style.display = 'flex';

    this.minimapWrapper.setVisible(true);
    this.minimapBackground.setVisible(true);
    this.game.scene.start("MinimapScene");

    this.bottomNav.updateActiveChangesCount();
  }

  clearOverlay() {
    logger.log('ToolsManager: clearOverlay');

    this.overlay.destroy();
    this.overlay = null;
  }

  clearInfoBox() {
    logger.log('ToolsManager: clearInfoBox');

    this.infobox.destroy();
    this.infobox = null;
  }

  clearMenu() {
    logger.log('ToolsManager: clearMenu');

    this.menu.destroy();
    this.menu = null;
  }
}
