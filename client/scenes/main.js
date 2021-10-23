
import { getColorForXY } from '@actions/pixel';
import config from '@util/config';

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
  getLastPosition,
  setInvertedStroke,
  resetStrokeStyle
} from '@actions/general';

export default class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true });
  }

  preload() {
    this.load.image('worldimage', `${config.events.url}/image`);
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
    moveToPosition({ ...getLastPosition(), scene: this })

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

    this.input.keyboard.on('keyup-G', (event) => {
      console.log('keyup-G', this);

      if (!this.gameOfLife)
        this.startGameOfLife();
      else
        this.stopGameOfLife();
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

  update(time, delta) {
    if (DEBUG) console.log("Main Scene: update", time, delta);
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

  updateTiles() {
    if (DEBUG) console.log("Main Scene: updateTiles");

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.updateTile(x, y);

    return;
  }

  updateTile(x, y) {
    if (DEBUG) console.log("Main Scene: updateTile");

    if (this.gameOfLife) {
      this.land[y][x].setFillStyle(this.land[y][x].alive ? 0x000000 : 0xFFFFFF);
      return;
    }

    const mapPixel = getColorForXY({ x, y, color: this.color, scene: this });

    this.land[y][x].cx = mapPixel.cx;
    this.land[y][x].cy = mapPixel.cy;

    this.land[y][x].setFillStyle(mapPixel.color.color);

    if (this.game.mode !== 'move') { // Add stroke if mode is not move
      if (this.game.selection.isSelected(mapPixel.cx, mapPixel.cy))
        setInvertedStroke({ scene: this, tile: this.land[y][x] });
      else
        resetStrokeStyle({ scene: this, tile: this.land[y][x] });
    }
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

  /**
   * Game of life
   * Will probably need a new scene
   * Need to refractor "land" and move tiles to a new service
   */

  startGameOfLife() {
    this.gameOfLife = true;

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.land[y][x].alive = Phaser.Math.RND.between(0.085, 0.09) > Math.random();

    this.timer = this.time.addEvent({
      delay: 200,
      callback: this.checkSurrounding,
      callbackScope: this,
      loop: true
    });
  }

  stopGameOfLife() {
    this.gameOfLife = false;

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.land[y][x].alive = null;

    if (this.timer)
      this.time.removeEvent(this.timer);

    this.updateTiles();
  }

  isAlive(x, y) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false;
    }

    return this.land[y][x].alive ? 1 : 0;
  }

  checkSurrounding() {
    if (DEBUG) console.log("Main Scene: checkSurrounding");
    // Loop over all cells
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {

        // Count the nearby population
        let aliveNeighbours = this.isAlive(x - 1, y - 1) +
          this.isAlive(x, y - 1) +
          this.isAlive(x + 1, y - 1) +
          this.isAlive(x - 1, y) +
          this.isAlive(x + 1, y) +
          this.isAlive(x - 1, y + 1) +
          this.isAlive(x, y + 1) +
          this.isAlive(x + 1, y + 1);

        //console.log('numAlive', numAlive);
        const alive = this.land[y][x].alive;

        // Cell is lonely and dies
        if (alive && (aliveNeighbours < 2))
          this.land[y][x].alive = 0;

        // Cell dies due to over population
        else if (alive && (aliveNeighbours > 3))
          this.land[y][x].alive = 0;

        // A new cell is born
        else if (!alive && (aliveNeighbours == 3))
          this.land[y][x].alive = 1;

        // Remains the same
        else
          this.land[y][x].alive = this.land[y][x].alive;
      }
    }

    this.updateTiles();
  }
}
