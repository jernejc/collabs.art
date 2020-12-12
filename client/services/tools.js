
import Menu from '@components/menu';

export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = this.gameCanvas.parentNode;

    //this.addModeButtons();
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
    /*this.emitter.on('scene/mode', mode => {
      if (this.game.mode !== mode)
        this.setActiveMode(mode);
    });

    this.domModeButtons.addEventListener('click', (e) => {
      const gameMode = e.target.dataset.gameMode || e.target.parentNode.dataset.gameMode;

      if (this.game.mode !== gameMode)
        this.emitter.emit('scene/mode', gameMode);
    });*/

    this.domMenuButtons.addEventListener('click', async (e) => {
      const menu = e.target.dataset.gameMode || e.target.parentNode.dataset.gameMode;

      console.log('menu CLICK', menu, this);
      if (!this.domMenuItem)
        await this.openMenu()
    });
  }

  async openMenu() {
    this.menu = new Menu({ parent: this.parent, game: this.game });
    await this.menu.init();
  }

  setActiveMode(mode) {
    const modes = this.domModeButtons.querySelectorAll('.mode');

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
  }

  addModeButtons() {
    this.domModeButtons = document.createElement('div');
    this.domModeButtons.setAttribute('id', 'mode-buttons');

    this.parent.appendChild(this.domModeButtons);

    this.modes = [{
      name: 'move',
      icon: 'gg-controller'
    }, {
      name: 'select',
      icon: 'gg-tap-single'
    }];

    this.modes.forEach(tool => {
      const button = this.buttonTemplate(tool, 'mode');

      if (this.game.appConfig.defaultMode === tool.name)
        button.classList.add('active');

      this.domModeButtons.appendChild(button);
    })
  }

  buttonTemplate(tool, type) {
    const button = document.createElement('span');

    button.classList.add(type, tool.name);
    button.dataset.gameMode = tool.name;

    const icon = document.createElement('i');
    icon.classList.add(tool.icon);

    button.appendChild(icon);
    return button;
  }
}
