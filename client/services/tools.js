
import config from '@util/config';

import InfoBox from '@components/infobox';
import Menu from '@components/menu';

import Button from '@components/form/button';
import Input from '@components/form/input';

export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = document.body.querySelector('#game');
    this.infobox = null;
    this.search = {
      text: ''
    }

    this.addConnectionStatus();
    this.addBottomNav();
    this.addEvents();
  }

  addEvents() {
    this.emitter.on('web3/address', async address => {
      this.setActiveConnection(address);

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/purchase', async address => {
      if (this.menu && this.menu.activeTab === 'selection')
        await this.menu.createSettings();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('selection/update', async pixels => {
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
      if (this.menu)
        this.clearMenu();

      if (this.infobox)
        this.clearInfoBox();
    })
  }

  async openMenu(activeTab) {

    if (this.menu && this.menu.loaded)
      this.clearMenu();

    this.menu = new Menu({ parent: this.parent, game: this.game, activeTab });

    // Init is async 
    await this.menu.init();
  }

  async openInfoBox({ pixel }) {
    if (this.infobox)
      this.clearInfoBox()

    this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, game: this.game });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  setActiveConnection(address) {
    const connection = this.domConnectionStatus.querySelector('.connection');
    const icon = connection.querySelector('i');

    if (icon.classList.contains('gg-block')) {
      icon.classList.remove('gg-block');
      icon.classList.add('gg-data');
    } else if (icon.classList.contains('gg-data')) {
      if (!address) {
        icon.classList.remove('gg-data');
        icon.classList.add('gg-block');
      } else
        console.log('blink');
    }
  }

  addBottomNav() {
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
        console.log('this.search.text onChange', this.search.text)
        if (this.menu && this.menu.loaded) {

          //await this.menu.loadPixels();
        }
      }
    }));

    this.parent.appendChild(this.domBottomNav);
  }

  addConnectionStatus() {
    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'connection-status');

    this.domConnectionStatus.appendChild(new Button({
      elClasses: ['account', 'connection'],
      iconClass: this.game.web3.isProviderConnected() ? 'gg-data' : 'gg-block',
      clickAction: async () => {
        if (!this.game.web3.activeAddress)
          await this.game.web3.getActiveAddress();
      }
    }));

    this.parent.appendChild(this.domConnectionStatus);
  }

  addOverlay() {
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
    this.closeOverlay.removeEventListener('click', this.closeOverlay);
    this.parent.removeChild(this.overlay);

    this.overlay = null;
    this.overlayContent = null;
    this.overlayNav = null;
    this.closeOverlay = null;
  }

  clearInfoBox() {
    this.infobox.destroy();
    this.infobox = null;
  }

  clearMenu() {
    this.menu.destroy();
    this.menu = null;
  }
}
