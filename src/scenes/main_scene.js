
import Phaser from 'phaser';

import { createPixel, colorPixel } from '@actions/pixel';
import { ApplicationScene } from '@scenes/application_scene';
import { MinimapScene } from '@scenes/minimap_scene';
import {
  handleMouseMove,
  handleMouseDown,
  handleMouseUp,
  handleShiftDown,
  handleShiftUp,
  setGameMode
} from '@actions/user_interactions';

export class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true });
  }

  preload() {
    this.load.image('worldmap', 'assets/images/place.png');
  }

  create(data) {
    super.create(data)

    const _self = this;

    //this.blockPadding = this.appConfig.blockPadding || 2;
    this.size = this.appConfig.gridSize;
    this.strokeSize = this.appConfig.strokeSize;
    this.pixelSize = this.size + this.strokeSize;
    this.strokeColor = Phaser.Display.Color.HexStringToColor(this.appConfig.strokeColor);
    this.gridWidth = this.appConfig.canvasWidth / this.size;
    this.gridHeight = this.appConfig.canvasHeight / this.size;

    this.cameraX = 700;
    this.cameraY = 600;
    this.pMax = 1000;
    this.land = [];

    const src = this.textures.get('worldmap').getSourceImage();

    this.imageWidth = src.width;
    this.imageHeight = src.height;

    this.worldmap = this.textures.createCanvas('map', this.imageWidth, this.imageHeight);
    this.worldmap.draw(0, 0, src);

    this.minimap = new MinimapScene({
      appConfig: this.appConfig,
      sceneConfig: {
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight,
        size: this.size
      }
    });

    this.scene.add('MinimapScene', this.minimap, true);
    this.createVisiblePixels();

    setGameMode({ scene: this, mode: "select" });

    this.input.mouse.disableContextMenu(); // prevent right click context menu

    /** 
     * Mouse Events
     */

    this.input.on('pointermove', (pointer) => {
      //console.log('MAINSCENE EVENT:pointermove', pointer)

      handleMouseMove({ pointer, scene: this });
    });

    this.input.on('pointerdown', (pointer) => {
      //console.log('MAINSCENE EVENT:pointerdown', pointer);

      handleMouseDown({ pointer, scene: this });
    });

    this.input.on('pointerup', (pointer) => {
      //console.log('MAINSCENE EVENT:pointerup', pointer);

      handleMouseUp({ pointer, scene: this });
    });

    this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      console.log('Main Scene: Wheel event');

      const newSize = (dy < 0) ? this.size + 1 : this.size - 1;

      if (newSize > 15 && newSize < 35) {
        this.size = newSize;
        this.gridWidth = this.appConfig.canvasWidth / this.size;
        this.gridHeight = this.appConfig.canvasHeight / this.size;

        this.clearVisiblePixel();
        this.createVisiblePixels();
      }
    });

    /** 
     * Keyboard events
     */

    this.input.keyboard.on('keydown_SHIFT', (event) => {
      handleShiftDown({ scene: _self })
    });

    this.input.keyboard.on('keyup_SHIFT', (event) => {
      handleShiftUp({ scene: _self })
    })

    this.game.emitter.on('scene/mode', (mode) => {
      if (_self.game.mode !== mode)
        setGameMode({ scene: _self, mode: mode });
    });

    // Main scene is ready.
    this.game.emitter.emit('scene/ready');
  }

  update() {
    console.log("Main Scene: update")
  }

  updateLand() {
    console.log("Main Scene: updateLand");
    
    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        colorPixel({ x, y, scene: this });

    return;
  }

  createVisiblePixels() {
    console.log("Main Scene: createVisiblePixels");

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.land[y])
        this.land[y] = [];

      for (let x = 0; x < this.gridWidth; x++) {
        this.land[y][x] = createPixel({ x, y, scene: this });
        colorPixel({ x, y, scene: this });
      }
    }

    return;
  }

  clearVisiblePixel() {
    console.log("Main Scene: clearVisiblePixel");

    this.land.forEach(y => {
      y.forEach(x => {
        x.destroy();
      });
    });

    this.land = [];

    return;
  }
}
