
import Menu from '@components/menu';

export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = this.gameCanvas.parentNode;

    this.addConnectionStatus();
    this.addMenuButtons();

    this.addEvents();
  }

  addMenuButtons() {
    this.domMenuButtons = document.createElement('div');
    this.domMenuButtons.setAttribute('id', 'menus');

    this.menus = [{
      name: 'pixels',
      icon: 'gg-row-last'
    }, {
      name: 'bids',
      icon: 'gg-align-bottom'
    }];

    this.menus.forEach(tool => {
      const button = this.buttonTemplate(tool, 'menu-btn');
      this.domMenuButtons.appendChild(button);
    })

    this.parent.appendChild(this.domMenuButtons);
  }

  addEvents() {
    this.emitter.on('web3/address', async address => {
      this.setActiveConnection(address);

      if (this.menu)
        await this.menu.loadPixels();
    }); 

    this.domConnectionStatus.addEventListener('click', async () => {
      if (!this.game.web3.activeAddress)
        await this.game.web3.getActiveAddress();
    });

    this.domMenuButtons.addEventListener('click', async (e) => {
      const menu = e.target.dataset.gameMode || e.target.parentNode.dataset.gameMode;

      if (DEBUG) console.log('menu CLICK', menu, this);

      if (!this.domMenuItem)
        await this.openMenu()
    });
  }

  async openMenu() {
    this.menu = new Menu({ parent: this.parent, game: this.game });

    // Init is async 
    await this.menu.init();
  }

  /*setActiveMode(mode) {
    const modes = this.domConnectionStatus.querySelectorAll('.mode');

    for (let index = 0; index < modes.length; index++) {
      const tool = modes[index];

      if (tool.dataset.gameMode === mode) {
        if (!tool.classList.contains('active'))
          tool.classList.add('active')
      } else {
        if (tool.classList.contains('active'))
          tool.classList.remove('active')
      }
    }
  }*/

  setActiveConnection(address) {
    const connections = this.domConnectionStatus.querySelectorAll('.connection');

    for (let index = 0; index < connections.length; index++) {
      const connection = connections[index];

      if (connection.dataset.connection === 'account') {
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
    }
  }

  addConnectionStatus() {
    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'user-buttons');

    this.parent.appendChild(this.domConnectionStatus);

    this.connections = [{
      name: 'account',
      icon: this.game.web3.isProviderConnected() ? 'gg-data' : 'gg-block'
    }];

    this.connections.forEach(tool => {
      const button = this.buttonTemplate(tool, 'connection');

      if (this.game.appConfig.defaultMode === tool.name)
        button.classList.add('active');

      this.domConnectionStatus.appendChild(button);
    })
  }

  buttonTemplate(tool, type) {
    const button = document.createElement('span');

    button.classList.add(type, tool.name);
    button.dataset.connection = tool.name;

    const icon = document.createElement('i');
    icon.classList.add(tool.icon);

    button.appendChild(icon);
    return button;
  }
}
