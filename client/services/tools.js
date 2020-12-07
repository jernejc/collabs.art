
export default class ToolsManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    console.log('this.game', this.game)

    this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    this.parent = this.gameCanvas.parentNode;
    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'tools');

    this.parent.appendChild(this.domElement);

    this.addTools();
    this.addEvents();
  }

  addEvents() {
    this.emitter.on('scene/mode', mode => {
      console.log('Tools scene/mode', mode);
      if (this.game.mode !== mode)
        this.setActiveTool(mode);
    });

    this.domElement.addEventListener('click', (e) => {
      const gameMode = e.target.dataset.gameMode || e.target.parentNode.dataset.gameMode;

      if (gameMode)
        this.emitter.emit('scene/mode', gameMode);
    });
  }

  setActiveTool(mode) {
    const tools = this.domElement.querySelectorAll('.tool');

    for (let index = 0; index < tools.length; index++) {
      const tool = tools[index];

      if (tool.classList.contains(mode)) {
        if (!tool.classList.contains('active'))
          tool.classList.add('active')
      } else {
        if (tool.classList.contains('active'))
          tool.classList.remove('active')
      }
    }
  }

  addTools() {
    this.tools = [{
      name:'move',
      icon: 'gg-controller'
    }, {
      name: 'select',
      icon: 'gg-tap-single'
    }];

    this.tools.forEach(tool => {
      const button = this.buttonTemplate(tool);

      console.log('this.game.mode', this.game.mode)
      console.log('tool.name', tool.name)

      if (this.game.mode === tool.name)
        button.classList.add('active');

      this.domElement.appendChild(button);
    })
  }
  
  buttonTemplate(tool) {
    const button = document.createElement('span');
    button.classList.add('tool', tool.name);
    button.dataset.gameMode = tool.name;

    const icon = document.createElement('i');
    icon.classList.add(tool.icon);

    button.appendChild(icon);
    return button;
  }

}
