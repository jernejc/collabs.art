import { Events, Game, WEBGL } from 'phaser';

// Config
import config from '@util/config';

// Scenes
import MainScene from '@scenes/main';

// Services
import Web3Manager from '@services/web3';
import SelectionManager from '@services/selection';
import ToolsManager from '@services/tools';
import GraphManager from '@services/subgraph';

// Game init
export async function AppInitializer() {
  if (DEBUG) console.log('AppInitializer')

  const canvas = document.querySelector('#' + config.appConfig.canvasElement)
  const Emitter = new Events.EventEmitter();
  const GameInstance = new Game({
    type: WEBGL,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    parent: config.appConfig.canvasElement,
    physics: {
      default: 'arcade'
    }
  });

  let gridSize = config.appConfig.gridSize, strokeSize = config.appConfig.strokeSize;

  if (window.devicePixelRatio > 1) {
    // GridSize calc
    gridSize = parseInt(gridSize - (gridSize * 0.35) / window.devicePixelRatio);
    // Stroke size calc
    strokeSize = strokeSize + (window.devicePixelRatio * (strokeSize * 0.35));
  }

  console.log('window.devicePixelRatio', window.devicePixelRatio);
  console.log('gridSize', gridSize);
  console.log('strokeSize', strokeSize);

  GameInstance.emitter = Emitter;
  GameInstance.appConfig = {
    canvasWidth: canvas.clientWidth,
    canvasHeight: canvas.clientHeight,
    pixelRatio: window.devicePixelRatio,
    defaultMode: config.appConfig.defaultMode,
    gridSize: gridSize,
    canvasElement: config.appConfig.canvasElement,
    strokeColor: config.appConfig.strokeColor,
    strokeSize: strokeSize
  }

  // Init Web3 Manager
  GameInstance.web3 = new Web3Manager(GameInstance, Emitter);
  // Web3Provider init is async
  await GameInstance.web3.initProvider();

  // Init Selection Manager
  GameInstance.selection = new SelectionManager(GameInstance, Emitter);
  // Init Graph Manager
  GameInstance.graph = new GraphManager();
  // Init Tools Manager
  GameInstance.tools = new ToolsManager(GameInstance, Emitter);

  // Add MainScene
  GameInstance.scene.add('MainScene', MainScene, true, {});

  return { GameInstance, Emitter };
}
