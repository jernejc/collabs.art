
import config from '@util/config';

import InfoBox from '@components/infobox';
import Menu from '@components/menu';

import Button from '@components/form/button';
import Input from '@components/form/input';

export default class ToolsManager {

  constructor(game, emitter) {
    if (DEBUG) console.log('ToolsManager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = document.body.querySelector('#game');
    this.infobox = null;
    this.search = {
      text: ''
    }

    this.addConnectionStatus();
    this.addNetworkAlert();
    this.addBottomNav();
    this.addEventListeners();
  }

  addEventListeners() {
    this.emitter.on('web3/network', async network => {
      /*if (DEBUG)*/ console.log('ToolsManager: on web3/network');

      this.setActiveConnection(network);
    });

    this.emitter.on('web3/address', async address => {
      if (DEBUG) console.log('ToolsManager: on web3/address');

      this.setActiveConnection(address);

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
      this.clearInfoBox()

    this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, game: this.game });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  setActiveConnection(network) {
    /*if (DEBUG)*/ console.log('ToolsManager: setActiveConnection', network);

    const icon = this.connectionStatus.querySelector('i');

    if (network) {
      icon.classList.remove('gg-block');
      icon.classList.add('gg-data');

      this.networkAlert.classList.remove('show');
      this.networkAlert.classList.add('hide');
    } else {
      icon.classList.remove('gg-data');
      icon.classList.add('gg-block');

      this.networkAlert.classList.remove('hide');
      this.networkAlert.classList.add('show');

      if (DEBUG) console.log('ToolsManager: blink');
    }
  }

  addBottomNav() {
    if (DEBUG) console.log('ToolsManager: addBottomNav');

    this.domBottomNav = document.createElement('div');
    this.domBottomNav.setAttribute('id', 'bottom-nav');

    this.domBottomNav.appendChild(new Button({
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
    }));

    this.domBottomNav.appendChild(new Input(this.search, 'text', {
      scene: this.scene,
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

    this.parent.appendChild(this.domBottomNav);
  }

  addConnectionStatus() {
    /*if (DEBUG)*/ console.log('ToolsManager: addConnectionStatus', this.game.web3.isConnected);

    const isConnected = this.game.web3.isConnected;

    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'connection-status');

    this.connectionStatus = new Button({
      elClasses: ['account', 'connection'],
      iconClass: isConnected ? 'gg-data' : 'gg-block',
      clickAction: async () => {
        if (!this.game.web3.activeAddress)
          await this.game.web3.getActiveAddress();
      }
    });

    this.domConnectionStatus.appendChild(this.connectionStatus);

    this.parent.appendChild(this.domConnectionStatus);
  }

  addNetworkAlert() {
    /*if (DEBUG)*/ console.log('ToolsManager: addNetworkAlert', this.game.web3.isConnected);

    const isConnected = this.game.web3.isConnected;

    this.networkAlert = document.createElement('div');
    this.networkAlert.setAttribute('id', 'alert');
    this.networkAlert.innerText = 'Please connect to network';

    if (!isConnected)
      this.networkAlert.classList.add('show');
    else
      this.networkAlert.classList.add('hide');

    this.parent.appendChild(this.networkAlert);
  }

  addOverlay() {
    if (DEBUG) console.log('ToolsManager: addOverlay');

    this.overlay = document.createElement('div');
    this.overlay.classList.add('overlay');

    this.overlayContent = document.createElement('div');
    this.overlayContent.classList.add('center');

    // Find better solution for this
    this.overlayContent.innerHTML = config.overlayContent;

    this.overlayNav = document.createElement('div');
    this.overlayNav.classList.add('nav');

    this.closeOverlay = document.createElement('button');
    this.closeOverlay.textContent = 'Close';

    const _self = this;

    this.closeOverlay.addEventListener('click', () => {
      _self.clearOverlay()
    });

    this.overlayNav.appendChild(this.closeOverlay);

    this.overlayContent.appendChild(this.overlayNav);
    this.overlay.appendChild(this.overlayContent);
    this.parent.appendChild(this.overlay);
  }

  clearOverlay() {
    if (DEBUG) console.log('ToolsManager: addOverlay');

    this.closeOverlay.removeEventListener('click', this.closeOverlay);
    this.parent.removeChild(this.overlay);

    this.overlay = null;
    this.overlayContent = null;
    this.overlayNav = null;
    this.closeOverlay = null;
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
