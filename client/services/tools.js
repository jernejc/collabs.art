
import Menu from '@components/menu';
import Button from '@components/button';
import Input from '@components/input';

export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = this.gameCanvas.parentNode;
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
    });

    this.emitter.on('selection/update', async () => {
      if (this.menu && this.menu.loaded) {
        if (this.menu.activeTab === 'selection');
          await this.menu.loadPixels();

        if (this.setting)
          this.resetSettings();

        this.menu.createSettings();
      }
    })
  }

  async openMenu(activeTab) {

    if (this.menu && this.menu.loaded)
      this.menu.close();

    this.menu = new Menu({ parent: this.parent, game: this.game, activeTab });

    // Init is async 
    await this.menu.init();
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
        if (!this.menu || !this.menu.loaded) 
          await this.openMenu(this.game.selection.pixels.length > 0 ? 'selection' : null);
        else
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
}
