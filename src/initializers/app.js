import { Events, Game, WEBGL } from 'phaser';
import { MainScene } from '@scenes/main_scene';

export function AppInitializer({
  canvasElement,
  canvasWidth,
  canvasHeight,
  gridSize,
  strokeColor,
  strokeSize
}) {
  console.log('Init Phaser', canvasElement, canvasWidth, canvasHeight)

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
  //Game.scene.add('MinimapScene', MinimapScene, true, {});

  return { GameInstance, Emitter };
}
