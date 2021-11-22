import _ from 'lodash';

import config from '@util/config';

import { getCookie, hexStringToColor } from '@util/helpers';
import ApplicationScene from '@scenes/application';

import { getColorForXY } from '@actions/pixel';
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
    this.strokeColor = hexStringToColor(this.appConfig.strokeColor);
    this.gridWidth = this.appConfig.canvasWidth / this.size;
    this.gridHeight = this.appConfig.canvasHeight / this.size;
    this.pMax = 1000;

    this.imageWidth = sourceImage.width;
    this.imageHeight = sourceImage.height;

    this.worldmap = this.textures.createCanvas('worldmap', this.imageWidth, this.imageHeight);
    this.worldmap.draw(0, 0, sourceImage);

    this.input.mouse.disableContextMenu(); // prevent right click context menu

    this.createVisibleTiles();

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

    moveToPosition({ ...getLastPosition(), scene: this });

    if (this.game.web3.onboarding) {
      if (this.game.web3.onboarding.state !== 'REGISTERED') {
        this.startGameOfLife();
      } else
        setGameMode({ scene, mode: 'select' })
    }

    //window.addEventListener('resize', this.resize.bind(this));
  }

  update() {
    if (DEBUG) console.log('Main scene: update');

    /*if (this.game.mode === 'gameoflife')
      this.updateTiles()*/
  }

  // based on https://supernapie.com/blog/support-retina-with-phaser-3/
  resize() {
    let w = window.innerWidth * window.devicePixelRatio;
    let h = window.innerHeight * window.devicePixelRatio;

    //this.scale.resize(w, h);

    /*for (let scene of this.scene.manager.scenes) {
      if (scene.scene.settings.active) {
        scene.cameras.main.setViewport(0, 0, w, h);
        if (scene.resizeField) {
          scene.resizeField(w, h);
        }
      }
    }*/
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

    const random = hexStringToColor(this.appConfig.defaultTileColors[Phaser.Math.Between(0, this.appConfig.defaultTileColors.length - 1)])

    if (this.gameOfLife) {
      const fillColor = this.tiles[y][x].alive ? random.color : 0x000000;
      this.tiles[y][x].setFillStyle(fillColor);
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
   * Need to refractor "tiles" and move them to a new service
   */

  startGameOfLife() {
    if (DEBUG) console.log("Main Scene: startGameOfLife");

    this.gameOfLife = true;

    const edge = 5;
    const widthEdge = this.gridWidth - edge;
    const heightEdge = this.gridWidth - edge;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        let probability = 0.1;

        if (
          edge > x ||
          x > widthEdge ||
          edge > y ||
          y > heightEdge
        )
          probability += 0.1

        this.tiles[y][x].alive = probability > Math.random();
      }
    }

    this.game.tools.hideTools();

    this.timer = this.time.addEvent({
      delay: 160,
      callback: this.nextGeneration,
      callbackScope: this,
      loop: true
    });

    if (!getCookie('hideOverlay'))
      this.game.tools.openOverlay();

    setGameMode({ scene: this, mode: 'gameoflife' });
  }

  stopGameOfLife() {
    if (DEBUG) console.log("Main Scene: stopGameOfLife");

    this.gameOfLife = false;

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.tiles[y][x].alive = null;

    if (this.timer)
      this.time.removeEvent(this.timer);

    this.updateTiles();
    this.game.tools.showTools();

    setGameMode({ scene: this, mode: this.appConfig.defaultMode });
  }

  isAlive(x, y) {
    if (DEBUG) console.log("Main Scene: isAlive");

    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight)
      return false;

    return this.tiles[y][x].alive ? 1 : 0;
  }

  nextGeneration() {
    if (DEBUG) console.log("Main Scene: nextGeneration");

    // Calculate next generation
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {

        // Count the nearby population
        const aliveNeighbours = this.isAlive(x - 1, y - 1) +
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
