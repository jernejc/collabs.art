import Phaser from 'phaser'
import { MainScene } from '@scenes/main_scene'
import { AvailableColors } from '@scripts/util/colors'

export function AppInitializer({
  canvasElement
}) {
  const Emitter = new Phaser.Events.EventEmitter();

  const Game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: canvasElement
  });

  Game.emitter = Emitter

  Game.scene.add('MainScene', MainScene, true, {});

  return { Game, Emitter }
}
