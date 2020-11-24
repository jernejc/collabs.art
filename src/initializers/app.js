import { Events, Game, WEBGL } from 'phaser';

import MainScene from '@scenes/main_scene';
import Web3Manager from '@util/web3_manager';
import SelectionManager from '@util/selection_manager';

export function AppInitializer({
  canvasElement,
  canvasWidth,
  canvasHeight,
  gridSize,
  strokeColor,
  strokeSize
}) {
  if (DEBUG) console.log('Init Phaser', canvasElement, canvasWidth, canvasHeight)

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
    canvasWidth,
    canvasHeight,
    gridSize,
    canvasElement,
    strokeColor,
    strokeSize
  }

  GameInstance.scene.add('MainScene', MainScene, true, {});

  // Init Web3 Manager
  GameInstance.web3 = new Web3Manager();
  // Init Selection Manager
  GameInstance.selection = new SelectionManager(GameInstance);

  return { GameInstance, Emitter };
}
