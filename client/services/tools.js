
export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = this.gameCanvas.parentNode;
    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'tools');

    this.parent.appendChild(this.domElement);

    this.addModeButtons();
    this.addEvents();
  }

  addEvents() {
    this.emitter.on('scene/mode', mode => {
      if (this.game.mode !== mode)
        this.setActiveMode(mode);
    });

    this.domElement.addEventListener('click', (e) => {
      const gameMode = e.target.dataset.gameMode || e.target.parentNode.dataset.gameMode;

      if (gameMode)
        this.emitter.emit('scene/mode', gameMode);
    });
  }

  setActiveMode(mode) {
    const tools = this.domElement.querySelectorAll('.tool');

    for (let index = 0; index < tools.length; index++) {
      const tool = tools[index];

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
    this.tools = [{
      name: 'move',
      icon: 'gg-controller'
    }, {
      name: 'select',
      icon: 'gg-tap-single'
    }];

    this.tools.forEach(tool => {
      const button = this.modeButtonTemplate(tool);

      if (this.game.appConfig.defaultMode === tool.name)
        button.classList.add('active');

      this.domElement.appendChild(button);
    })
  }

  modeButtonTemplate(tool) {
    const button = document.createElement('span');
    button.classList.add('tool', tool.name);
    button.dataset.gameMode = tool.name;

    const icon = document.createElement('i');
    icon.classList.add(tool.icon);

    button.appendChild(icon);
    return button;
  }
}
