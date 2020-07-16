//import { ToolsInitializer } from '@initializers/tools'
import { AppInitializer } from '@initializers/app'

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
}

export class InfoBox {

  constructor(pixel, parent) {
    //console.log('InfoBox pixel', pixel, parent)
    this.setupTemplate(pixel, parent);
    this.setPosition(pixel, parent);
  }

  setPosition(pixel, parent) {
    //console.log('setPosition', pixel, parent.offsetWidth, pixel.tile.x, this.wrapper.offsetWidth, pixel.tile.displayWidth)

    const padding = 2;
    const vertical = (pixel.tile.y > (parent.offsetHeight / 2)) ? 'down' : 'up'
    const horizontal = (pixel.tile.x > (parent.offsetWidth / 2)) ? 'left' : 'right'
    const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown'
    const top = (vertical === 'down') ? pixel.tile.y - this.wrapper.offsetHeight - padding : pixel.tile.y + pixel.tile.displayHeight + padding
    const left = (horizontal === 'left') ? pixel.tile.x - this.wrapper.offsetWidth - padding : pixel.tile.x + pixel.tile.displayWidth + padding

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add('animated', animationClass);
  }

  setupTemplate(pixel, parent) {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('info-box');
    this.wrapper.innerHTML = 'Some content here'

    try {
      parent.appendChild(this.wrapper);
    } catch (e) {
      return e;
    }
  }
}
