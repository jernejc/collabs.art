
import Phaser from 'phaser';

import { getColorForXY } from '@actions/pixel';
import ApplicationScene from '@scenes/application';
import MinimapScene from '@scenes/minimap';
import {
  handleMouseMove,
  handleMouseDown,
  handleMouseUp,
  //handleMouseWheel,
  handleSpaceDown,
  handleSpaceUp,
  handleShiftDown,
  handleShiftUp,
  setGameMode,
  moveToPosition,
  setInvertedStroke,
  resetStrokeStyle
} from '@actions/general';

export default class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true });
  }

  preload() {
    this.load.image('worldimage', 'assets/images/place.png');
  }

  create(data) {
    super.create(data);

    const _self = this;
    const sourceImage = this.textures.get('worldimage').getSourceImage();

    this.size = this.appConfig.gridSize;
    this.strokeSize = this.appConfig.strokeSize;
    this.strokeColor = Phaser.Display.Color.HexStringToColor(this.appConfig.strokeColor);
    this.gridWidth = this.appConfig.canvasWidth / this.size;
    this.gridHeight = this.appConfig.canvasHeight / this.size;
    this.pMax = 1000;

    this.imageWidth = sourceImage.width;
    this.imageHeight = sourceImage.height;

    this.worldmap = this.textures.createCanvas('worldmap', this.imageWidth, this.imageHeight);
    this.worldmap.draw(0, 0, sourceImage);

    this.input.mouse.disableContextMenu(); // prevent right click context menu

    this.createMinimap();
    this.createVisibleTiles();

    setGameMode({ scene: this, mode: this.appConfig.defaultMode });
    moveToPosition({ x: 300, y: 400, scene: this })

    /** 
     * Mouse Events
     */

    this.input.on('pointermove', (pointer) => {
      handleMouseMove({ pointer, scene: this });
    });

    this.input.on('pointerdown', async (pointer) => {
      await handleMouseDown({ pointer, scene: this });
    });

    this.input.on('pointerup', (pointer) => {
      handleMouseUp({ pointer, scene: this });
    });

    /*this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      handleMouseWheel({ scene: this, dx, dy, dz })
    });*/

    /** 
     * Keyboard events
     */

    this.input.keyboard.on('keydown-SHIFT', (event) => {
      handleShiftDown({ scene: _self })
    });

    this.input.keyboard.on('keyup-SHIFT', (event) => {
      handleShiftUp({ scene: _self })
    });

    this.input.keyboard.on('keydown-SPACE', (event) => {
      handleSpaceDown({ scene: _self })
    });

    this.input.keyboard.on('keyup-SPACE', (event) => {
      handleSpaceUp({ scene: _self })
    });

    /**
     * Game mode events
     */

    this.game.emitter.on('scene/mode', (mode) => {
      if (_self.game.mode !== mode)
        setGameMode({ scene: _self, mode: mode });
    });

    // Main scene is ready.
    this.game.emitter.emit('scene/ready');

    // Pause the update function
    //this.scene.pause();

    //console.log('MainScene this', this);
  }

  //update() {
  //if (DEBUG) console.log("Main Scene: update")
  //}

  updateTiles() {
    if (DEBUG) console.log("Main Scene: updateTiles");

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.updateTile(x, y);

    return;
  }

  createVisibleTiles() {
    if (DEBUG) console.log("Main Scene: createVisibleTiles");

    this.land = [];

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.land[y])
        this.land[y] = [];

      for (let x = 0; x < this.gridWidth; x++) {
        const tx = this.size * x;
        const ty = this.size * y;
        //if (DEBUG) console.log('tx ty', tx, ty)

        this.land[y][x] = this.add.rectangle(tx, ty, this.size, this.size);
        this.land[y][x].setDisplayOrigin(0, 0);

        this.updateTile(x, y);
      }
    }

    return;
  }

  updateTile(x, y) {

    const mapPixel = getColorForXY({ x, y, color: this.color, scene: this });

    this.land[y][x].cx = mapPixel.cx;
    this.land[y][x].cy = mapPixel.cy;

    this.land[y][x].setFillStyle(mapPixel.color.color);

    if (this.game.selection.isSelected(mapPixel.cx, mapPixel.cy))
      setInvertedStroke({ scene: this, tile: this.land[y][x] });
    else
      resetStrokeStyle({ scene: this, tile: this.land[y][x] });
  }

  clearVisibleTiles() {
    if (DEBUG) console.log("Main Scene: clearVisibleTiles");

    this.land.forEach(y => {
      y.forEach(x => {
        x.destroy();
      });
    });

    this.land = [];

    return;
  }

  createMinimap() {
    if (DEBUG) console.log("Main Scene: createMinimap");

    const sizeRatio = (window.devicePixelRatio > 1) ? 5 + (5 * 0.5 / window.devicePixelRatio) : 5;
    const margin = 7;
    const margin2X = margin + margin;

    // Minimap size
    const width = 1000 / sizeRatio;
    const height = 1000 / sizeRatio;

    // Minimap position
    const x = margin2X;
    const y = this.appConfig.canvasHeight - (height + margin2X);

    this.minimapWrapper = this.add.zone(
      x,
      y,
      width,
      height
    )
      .setInteractive()
      .setOrigin(0)
      .setDepth(3)

    this.minimapBackground = this.add.rectangle(
      x - margin,
      y - margin,
      width + margin2X,
      height + margin2X, Phaser.Display.Color.HexStringToColor('#181a1b').color, 1
    )
      .setOrigin(0)
      .setDepth(2)

    this.minimap = new MinimapScene({
      appConfig: this.appConfig,
      sceneConfig: {
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight,
        size: this.size,
        sizeRatio,
        margin,
        width,
        height,
        x,
        y
      }
    }, this.minimapWrapper);

    this.scene.add('MinimapScene', this.minimap, true);
  }
}
