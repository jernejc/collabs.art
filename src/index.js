//import { ToolsInitializer } from '@initializers/tools'
import { AppInitializer } from '@initializers/app'
import { SelectionInitializer } from '@initializers/selection'

/**
 * Main Phaser Game Class
 */

export class Main {
  debug() {
    game.scene
      .getScenes(true)[0]
      .load.setBaseURL()
      .setPath()
      .setPrefix()
      .scenePlugin(
        'PhaserDebugDrawPlugin',
        'https://cdn.jsdelivr.net/npm/phaser-plugin-debug-draw@4.5.0',
        'debugDraw',
      )
      .start();
  }

  AppInitializer(options) {
    this.world = AppInitializer(options)
    return this.world
  }

  /*ToolsInitializer(options) {
    ToolsInitializer()
  }*/

  SelectionInitializer(game, emitter) {
    return SelectionInitializer(game, emitter)
  }
}
