
import { getColorForXY } from '@actions/pixel';
import config from '@util/config';

import ApplicationScene from '@scenes/application';

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

    this.createVisibleTiles();

    setGameMode({ scene: this, mode: this.appConfig.defaultMode });
    moveToPosition({ ...getLastPosition(), scene: this });
    
    this.game.tools.addMinimap(this);

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
  }

  createVisibleTiles() {
    if (DEBUG) console.log("Main Scene: createVisibleTiles");

    this.tiles = [];

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.tiles[y])
        this.tiles[y] = [];

      for (let x = 0; x < this.gridWidth; x++) {
        const tx = this.size * x;
        const ty = this.size * y;
        //if (DEBUG) console.log('tx ty', tx, ty)

        this.tiles[y][x] = this.add.rectangle(tx, ty, this.size, this.size);
        this.tiles[y][x].setDisplayOrigin(0, 0);

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
      this.tiles[y][x].setFillStyle(this.tiles[y][x].alive ? 0x000000 : 0xFFFFFF);
      return;
    }

    const mapPixel = getColorForXY({ x, y, color: this.color, scene: this });

    this.tiles[y][x].cx = mapPixel.cx;
    this.tiles[y][x].cy = mapPixel.cy;

    this.tiles[y][x].setFillStyle(mapPixel.color.color);

    if (this.game.mode !== 'move') { // Add stroke if mode is not move
      if (this.game.selection.isSelected(mapPixel.cx, mapPixel.cy))
        setInvertedStroke({ scene: this, tile: this.tiles[y][x] });
      else
        resetStrokeStyle({ scene: this, tile: this.tiles[y][x] });
    }
  }

  clearVisibleTiles() {
    if (DEBUG) console.log("Main Scene: clearVisibleTiles");

    this.tiles.forEach(y => {
      y.forEach(x => {
        x.destroy();
      });
    });

    this.tiles = [];

    return;
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
        this.tiles[y][x].alive = 0.15 > Math.random();

    this.game.tools.hideTools();

    this.timer = this.time.addEvent({
      delay: 100,
      callback: this.nextGeneration,
      callbackScope: this,
      loop: true
    });
  }

  stopGameOfLife() {
    this.gameOfLife = false;

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.tiles[y][x].alive = null;

    if (this.timer)
      this.time.removeEvent(this.timer);

    this.updateTiles();
    this.game.tools.showTools();
  }

  isAlive(x, y) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false;
    }

    return this.tiles[y][x].alive ? 1 : 0;
  }

  nextGeneration() {
    if (DEBUG) console.log("Main Scene: nextGeneration");

    // Calculate next generation
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

        const state = this.tiles[y][x].alive;

        // Cell is lonely and dies
        if (state && (aliveNeighbours < 2))
          this.tiles[y][x].nextState = false;

        // Cell dies due to over population
        else if (state && (aliveNeighbours > 3))
          this.tiles[y][x].nextState = false;

        // A new cell is born
        else if (!state && (aliveNeighbours == 3))
          this.tiles[y][x].nextState = true;

        // Remains the same
        else
          this.tiles[y][x].nextState = state;
      }
    }

    // Apply the new state to the tiles
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++)
        this.tiles[y][x].alive = this.tiles[y][x].nextState;
    }

    this.updateTiles();
  }
}
