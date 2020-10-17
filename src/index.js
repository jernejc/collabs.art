//import { ToolsInitializer } from '@initializers/tools'
import { AppInitializer } from '@initializers/app';
import { SelectionInitializer } from '@initializers/selection';

/**
 * Main Phaser Game Class
 */

export class Main {

  AppInitializer(options) {
    this.world = AppInitializer(options);
    return this.world;
  }

  /*ToolsInitializer(options) {
    ToolsInitializer()
  }*/

  SelectionInitializer(game, emitter) {
    return SelectionInitializer(game, emitter);
  }
}
