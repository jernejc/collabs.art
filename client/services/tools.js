
import MinimapScene from '@scenes/minimap';

import InfoBox from '@components/infobox';
import Menu from '@components/menu';
import Overlay from '@components/overlay';

import Button from '@components/form/button';
import Input from '@components/form/input';

import { formatShortAddress } from '@util/helpers';

export default class ToolsManager {

  constructor(game, emitter) {
    if (DEBUG) console.log('ToolsManager: constructor', game);

    this.game = game;
    this.emitter = emitter;
    this.infobox = null;
    this.search = {
      text: ''
    }

    setTimeout(() => { // canvas null in Firefox -_-
      this.parent = this.game.canvas.parentNode;
      this.addHeader();
      this.addConnectionStatus();
      this.addNetworkAlert();
      this.addBottomNav();
      this.addEventListeners();
    });
  }

  get metamaskURL() {
    if (DEBUG) console.log('ToolsManager: metamaskURL', navigator.userAgent);

    let url;

    if (navigator.userAgent.search('Mozilla') > -1)
      url = 'https://addons.mozilla.org/sl/firefox/addon/ether-metamask/'
    else if (navigator.userAgent.search('Chrome') > -1)
      url = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

    return url;
  }

  addEventListeners() {
    this.emitter.on('web3/network', async network => {
      if (DEBUG) console.log('ToolsManager: on web3/network');

      this.setConnectionStatus();
      this.setNetworkAlert();

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/address', async address => {
      if (DEBUG) console.log('ToolsManager: on web3/address');

      this.setConnectionStatus();
      this.setNetworkAlert();

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/purchase', async address => {
      if (DEBUG) console.log('ToolsManager: on web3/purchase');

      if (this.menu && this.menu.activeTab === 'selection')
        await this.menu.createSettings();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('selection/update', async pixels => {
      if (DEBUG) console.log('ToolsManager: on selection/update');

      pixels = pixels || this.game.selection.pixels;

      if (pixels.length === 1) {
        if (!this.infobox)
          await this.openInfoBox({ pixel: pixels[0], scene: this.game.scene });
        else
          await this.infobox.setUI();

        if (this.menu)
          this.clearMenu();

        this.game.selection.clearRectangleSelection();
      } else if (pixels.length > 1) {
        if (this.infobox)
          this.clearInfoBox();

        if (!this.menu)
          await this.openMenu('selection');
        else if (this.menu) {
          if (this.menu.activeTab === 'selection') {
            await this.menu.loadPixels();
            this.menu.createSettings();
          }
        }
      }
    })

    this.emitter.on('selection/clear', async () => {
      if (DEBUG) console.log('ToolsManager: on selection/clear');

      if (this.menu)
        this.clearMenu();

      if (this.infobox)
        this.clearInfoBox();

      this.game.selection.clearRectangleSelection();
    })
  }

  async openMenu(activeTab) {
    if (DEBUG) console.log('ToolsManager: openMenu');

    if (this.menu && this.menu.loaded)
      this.clearMenu();

    this.menu = new Menu({ parent: this.parent, game: this.game, activeTab });

    // Init is async 
    await this.menu.init();
  }

  async openInfoBox({ pixel }) {
    if (DEBUG) console.log('ToolsManager: openInfoBox');

    if (this.infobox)
      this.clearInfoBox();

    this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, game: this.game });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  openOverlay() {
    if (DEBUG) console.log('ToolsManager: openOverlay');

    if (this.overlay)
      this.clearOverlay();

    this.overlay = new Overlay({ parent: this.parent, game: this.game, close: this.clearOverlay.bind(this) });
  }

  setConnectionStatus() {
    if (DEBUG) console.log('ToolsManager: setConnectionStatus');

    let iconClass = null;
    let action = null;
    let alertIcon = true;

    switch (this.game.web3.currentStateTag) {
      case 'metamask':
        iconClass = 'metamask-white';
        action = this.game.web3.onboarding.startOnboarding;
        break;
      case 'network':
        iconClass = 'polygon';
        action = this.game.web3.switchToNetwork.bind(this.game.web3);
        break;
      case 'wallet':
        iconClass = 'gg-link';
        action = this.game.web3.getActiveAddress.bind(this.game.web3);
        break;
      case 'address':
        alertIcon = false;
        iconClass = 'gg-user';
        break;
    }

    if (iconClass)
      this.connectionStatusBtn.setIcon(iconClass, alertIcon);
    if (action)
      this.connectionStatusBtn.setClickAction(action);
  }

  setNetworkAlert() {
    if (DEBUG) console.log('ToolsManager: setNetworkAlert');

    let text = null;

    switch (this.game.web3.currentStateTag) {
      case 'metamask':
        text = 'Install Metamask';
        break;
      case 'network':
        text = 'Switch to Network';
        break;
      case 'wallet':
        text = 'Connect to Wallet';
        break;
      case 'address':
        text = formatShortAddress(this.game.web3.activeAddress);
        break;
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
    if (DEBUG) console.log('ToolsManager: addBottomNav');

    this.domBottomNav = document.createElement('div');
    this.domBottomNav.setAttribute('id', 'bottom-nav');

    this.bottonNavMenuBtn = new Button({
      elClasses: ['pixels', 'menu-btn'],
      iconClass: 'gg-row-last',
      clickAction: async () => {
        if (!this.menu || !this.menu.loaded) {
          if (this.infobox)
            this.clearInfoBox()

          await this.openMenu(this.game.selection.pixels.length > 0 ? 'selection' : null);
        } else
          await this.menu.loadPixels();
      }
    });

    this.domBottomNav.append(this.bottonNavMenuBtn.domElement);
    this.domBottomNav.append(new Input(this.search, 'text', {
      scene: this.game.scene,
      type: 'text',
      placeholder: 'Find pixel.. (eg. RK438)',
      max: 6,
      onChange: async () => {
        console.log('ToolsManager: this.search.text onChange', this.search.text)
        if (this.menu && this.menu.loaded) {

          //await this.menu.loadPixels();
        }
      }
    }));

    this.parent.append(this.domBottomNav);
  }

  addHeader() {
    if (DEBUG) console.log('ToolsManager: addHeader');

    this.header = document.createElement('div');
    this.header.setAttribute('id', 'header');

    this.headerIcon = document.createElement('i');
    this.headerIcon.classList.add('gg-details-more');

    this.headerMenu = document.createElement('div');
    this.headerMenu.classList.add('header-menu');

    this.header.append(this.headerIcon);
    this.parent.append(this.header);
  }

  addConnectionStatus() {
    if (DEBUG) console.log('ToolsManager: addConnectionStatus');

    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'connection-status');

    this.connectionStatusBtn = new Button({
      elClasses: ['account', 'connection'],
      iconClass: 'gg-block'
    });

    this.domConnectionStatus.append(this.connectionStatusBtn.domElement);

    this.parent.append(this.domConnectionStatus);

    this.setConnectionStatus();
  }

  addNetworkAlert() {
    if (DEBUG) console.log('ToolsManager: addNetworkAlert');

    if (!this.domConnectionStatus) {
      console.warn('No connectino status DOM found. Skipping network alert');
      return;
    }

    this.networkAlert = document.createElement('div');
    this.networkAlert.setAttribute('id', 'alert');

    this.domConnectionStatus.prepend(this.networkAlert);

    this.networkAlert.addEventListener('click', (e) => {
      this.connectionStatusBtn.domElement.dispatchEvent(new Event('click', { 'bubbles': true }));
    });

    this.setNetworkAlert();
  }

  addMinimap(scene) {
    if (DEBUG) console.log("ToolsManager: addMinimap");

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
    if (DEBUG) console.log('ToolsManager: hideTools');

    this.networkAlert.style.display = 'none';
    this.connectionStatusBtn.domElement.style.display = 'none';
    this.domBottomNav.style.display = 'none';
    this.header.style.display = 'none';

    this.minimapWrapper.setVisible(false);
    this.minimapBackground.setVisible(false);
    this.game.scene.stop("MinimapScene");

    if (this.overlay)
      this.clearOverlay();
    if (this.infobox)
      this.clearInfoBox();
    if (this.menu)
      this.clearMenu();
  }

  showTools() {
    if (DEBUG) console.log('ToolsManager: showTools');

    this.networkAlert.style.display = 'flex';
    this.connectionStatusBtn.domElement.style.display = 'flex';
    this.domBottomNav.style.display = 'flex';
    this.header.style.display = 'flex';

    this.minimapWrapper.setVisible(true);
    this.minimapBackground.setVisible(true);
    this.game.scene.start("MinimapScene");
  }

  clearOverlay() {
    if (DEBUG) console.log('ToolsManager: clearOverlay');

    this.overlay.destroy();
    this.overlay = null;

    const MainScene = this.game.scene.keys["MainScene"];

    if (MainScene.game.mode === 'gameoflife')
      MainScene.stopGameOfLife();
  }

  clearInfoBox() {
    if (DEBUG) console.log('ToolsManager: clearInfoBox');

    this.infobox.destroy();
    this.infobox = null;
  }

  clearMenu() {
    if (DEBUG) console.log('ToolsManager: clearMenu');

    this.menu.destroy();
    this.menu = null;
  }
}
