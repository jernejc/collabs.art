import { Events, Game, WEBGL, Scale } from 'phaser';

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

  const canvas = document.querySelector('#' + config.appConfig.canvasElement);
  const canvasWidth = canvas.clientWidth //* window.devicePixelRatio;
  const canvasHeight = canvas.clientHeight //* window.devicePixelRatio;

  const Emitter = new Events.EventEmitter();
  const GameInstance = new Game({
    type: WEBGL,
    width: canvasWidth,
    height: canvasHeight,
    parent: config.appConfig.canvasElement,
    fps: {
      target: config.appConfig.fps,
      forceSetTimeOut: true
    },
    physics: {
      default: 'arcade'
    },
    scale: {
      mode: Scale.RESIZE,
      //zoom: 1 / window.devicePixelRatio
    }
  });

  let gridSize = config.appConfig.gridSize, strokeSize = config.appConfig.strokeSize;

  if (window.devicePixelRatio > 1) {
    // GridSize calc
    // Size needs to be different based on screen resolution
    gridSize = parseInt(gridSize + (gridSize * 0.2) / window.devicePixelRatio);
    strokeSize = strokeSize - (gridSize * 0.2 / window.devicePixelRatio);
  }

  GameInstance.emitter = Emitter;
  GameInstance.appConfig = {
    ...config.appConfig,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    pixelRatio: window.devicePixelRatio,
    gridSize,
    strokeSize
  }

  // Init Web3 Manager
  GameInstance.web3 = new Web3Manager(GameInstance, Emitter);
  // Web3Provider init is async
  await GameInstance.web3.initProviders();

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
