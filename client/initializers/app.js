import { Events, Game, WEBGL } from 'phaser';

// Scenes
import MainScene from '@scenes/main';

// Services
import Web3Manager from '@services/web3';
import SelectionManager from '@services/selection';
import ToolsManager from '@services/tools';
import GraphManager from '@services/subgraph';

// Game init
export async function AppInitializer({
  canvasElement,
  defaultMode,
  gridSize,
  strokeColor,
  strokeSize
}) {
  if (DEBUG) console.log('Init Phaser', canvasElement, defaultMode, gridSize, strokeColor, strokeSize)


  const canvas = document.querySelector('#' + canvasElement)
  const Emitter = new Events.EventEmitter();
  const GameInstance = new Game({
    type: WEBGL,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    parent: canvasElement
  });

  GameInstance.emitter = Emitter;
  GameInstance.appConfig = {
    canvasWidth: canvas.clientWidth,
    canvasHeight: canvas.clientHeight,
    defaultMode,
    gridSize,
    canvasElement,
    strokeColor,
    strokeSize
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
