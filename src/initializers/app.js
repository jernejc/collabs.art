import Phaser from 'phaser'
import { MainScene } from '@scenes/main_scene'
import { AvailableColors } from '@scripts/util/colors'

export function AppInitializer({
  canvasElement,
  canvasWidth,
  canvasHeight,
  gridSize,
  bgColor,
  strokeColor,
  strokeSize,
  blockPadding
}) {
  console.log('Init Phaser', canvasElement, canvasWidth, canvasHeight)
  const canvas = document.querySelector('#' + canvasElement)
  console.log('canvas', canvas.clientWidth, canvas.scrollHeight)
  const Emitter = new Phaser.Events.EventEmitter();
  const Game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    parent: canvasElement,
    mode: Phaser.DOM.FIT
  });

  Game.emitter = Emitter
  Game.appConfig = {
    canvasWidth,
    canvasHeight,
    gridSize,
    canvasElement,
    bgColor,
    strokeColor,
    strokeSize,
    blockPadding
  }
  Game.scene.add('MainScene', MainScene, true, {});
  //Game.scene.add('MinimapScene', MinimapScene, true, {});

  return { Game, Emitter }
}
