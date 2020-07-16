import Phaser from 'phaser'
import { MainScene } from '@scenes/main_scene'

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
  const Emitter = new Phaser.Events.EventEmitter();
  const Game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    parent: canvasElement
  });

  Game.emitter = Emitter
  Game.appConfig = {
    canvasWidth,
    canvasHeight,
    gridSize,
    canvasElement,
    strokeColor,
    strokeSize
  }
  Game.scene.add('MainScene', MainScene, true, {});
  //Game.scene.add('MinimapScene', MinimapScene, true, {});

  return { Game, Emitter }
}
