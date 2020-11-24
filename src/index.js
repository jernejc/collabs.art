
import { AppInitializer } from '@initializers/app';

export class Main {

  constructor(options) {
    this.world = AppInitializer(options);
    return this.world;
  }
}
