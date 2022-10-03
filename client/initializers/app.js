import { Events, Game, CANVAS, WEBGL, Scale } from 'phaser';

import config from '@util/config';
import { maliDetect, getGridSize } from '@util/helpers';
import logger from '@util/logger';

// Scenes
import MainScene from '@scenes/main';

// Services
import Web3Manager from '@services/web3';
import SelectionManager from '@services/selection';
import ToolsManager from '@services/tools';
import GraphManager from '@services/subgraph';
import FirebaseManager from '@services/firebase';

// Game init
export async function AppInitializer() {
  logger.log('AppInitializer');

  const canvas = document.querySelector('#' + config.appConfig.canvasElement);
  const canvasWidth = canvas.clientWidth //* window.devicePixelRatio;
  const canvasHeight = canvas.clientHeight //* window.devicePixelRatio;

  const Emitter = new Events.EventEmitter();
  const GameInstance = new Game({
    type: (maliDetect()) ? CANVAS : WEBGL,
    parent: config.appConfig.canvasElement,
    fps: {
      target: config.appConfig.fps,
      forceSetTimeOut: true
    },
    physics: {
      default: 'arcade'
    },
    scale: {
      mode: Scale.RESIZE
    }
  });

  window.devicePixelRatio = Math.ceil(window.devicePixelRatio);

  GameInstance.emitter = Emitter;
  GameInstance.appConfig = {
    ...config.appConfig,
    canvas,
    pixelRatio: window.devicePixelRatio
  }

  // Init Web3 Manager
  GameInstance.web3 = new Web3Manager(GameInstance, Emitter);
  // Web3Provider init is async
  await GameInstance.web3.initProviders();

  // Init Firebase tools
  GameInstance.firebase = new FirebaseManager(GameInstance, Emitter);
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
