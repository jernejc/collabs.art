import _ from 'lodash';

import ApplicationScene from '@scenes/application';

import { getColorForXY } from '@actions/pixel';
import {
  handleMouseMove,
  handleMouseDown,
  handleMouseUp,
  handleSpaceDown,
  handleSpaceUp,
  handleShiftDown,
  handleShiftUp,
  setGameMode,
  moveToPosition,
  getLastPosition,
} from '@actions/general';

import config from '@util/config';
import { hexStringToColor, getGridSize, detectMob } from '@util/helpers';
import logger from '@util/logger';

export default class MainScene extends ApplicationScene {
  constructor() {
    logger.log("MainScene: constructor");
    super({ key: 'MainScene', active: true });
  }

  preload() {
    logger.log("MainScene: preload");

    if (!this.textures.exists('worldimage'))
      this.load.image('worldimage', config.api.getImage);
  }

  create(data) {
    logger.log("MainScene: create");
    super.create(data);

    const sourceImage = this.textures.get('worldimage').getSourceImage();

    const { gridSize, strokeSize } = getGridSize({
      gridSize: config.appConfig.gridSize,
      strokeSize: config.appConfig.strokeSize
    });

    this.size = gridSize;
    this.strokeSize = strokeSize;

    this.strokeColor = hexStringToColor(this.appConfig.strokeColor);
    this.gridWidth = this.appConfig.canvas.clientWidth / this.size;
    this.gridHeight = this.appConfig.canvas.clientHeight / this.size;
    this.pMax = 1000;

    this.imageWidth = sourceImage.width;
    this.imageHeight = sourceImage.height;

    this.worldmap = this.textures.get('worldmap');

    if (!this.worldmap || this.worldmap.key !== "worldmap")
      this.worldmap = this.textures.createCanvas('worldmap', this.imageWidth, this.imageHeight);

    this.worldmap.draw(0, 0, sourceImage);

    this.input.mouse.disableContextMenu(); // prevent right click context menu

    this.createVisibleTiles();

    moveToPosition({ ...getLastPosition(), scene: this });

    if (this.game.web3.onboarding) {
      if (this.game.web3.onboarding.state !== 'REGISTERED') {
        setGameMode({ scene: this, mode: 'select' });
      } else
        setGameMode({ scene: this, mode: 'select' });
    }

    /** 
     * Mouse Events
     */

    this.input.on('pointermove', (pointer) => {
      handleMouseMove({ pointer, scene: this });
    });

    this.input.on('pointerdown', async (pointer) => {
      handleMouseDown({ pointer, scene: this });
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
      if (!this.game.tools.overlay || detectMob())
        this.game.tools.openOverlay();
      else
        this.game.tools.clearOverlay();
    });

    this.game.tools.initTools({ scene: this });

    if (!this.eventsEnabled)
      this.initGlobalEvents();
    else
      setGameMode({ scene: this, mode: 'select'})

    // Main scene is ready.
    this.game.emitter.emit('scene/ready');
  }

  initGlobalEvents() {
    const _self = this;

    /**
     * Game mode events
     */

    this.game.emitter.on('scene/mode', (mode) => {
      if (_self.game.mode !== mode)
        setGameMode({ scene: _self, mode: mode });
    });

    const debounceResize = _.debounce(this.resize.bind(this), 200);

    window.addEventListener('resize', debounceResize);

    this.eventsEnabled = true;
  }

  resize() {
    logger.log("MainScene: resize");

    this.game.selection.clearAllSelection();
    this.textures.remove('worldmap');
    this.registry.destroy();
    this.events.off();
    this.scene.remove('MinimapScene');
    this.scene.restart();
  }

  createVisibleTiles() {
    logger.log("MainScene: createVisibleTiles");

    this.tiles = [];

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.tiles[y])
        this.tiles[y] = [];

      for (let x = 0; x < this.gridWidth; x++) {
        const tx = this.size * x;
        const ty = this.size * y;

        this.tiles[y][x] = this.add.rectangle(tx, ty, this.size, this.size);
        this.tiles[y][x].setDisplayOrigin(0, 0);
      }
    }

    return;
  }

  updateTiles() {
    //logger.log("MainScene: updateTiles");

    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.updateTile(x, y);

    return;
  }

  updateTile(x, y) {
    //logger.log("MainScene: updateTile");

    if (this.game.mode === 'gameoflife') {
      const randomPixelColor = hexStringToColor(this.appConfig.defaultTileColors[Phaser.Math.Between(0, this.appConfig.defaultTileColors.length - 1)])
      let fillColor = this.appConfig.fillColor;

      if (this.tiles[y][x].intial || this.tiles[y][x].alive)
        fillColor = randomPixelColor;

      this.tiles[y][x].setFillStyle(fillColor.color);
      return;
    }

    const mapPixel = getColorForXY({ x, y, color: this.color, scene: this });

    this.tiles[y][x].cx = mapPixel.cx;
    this.tiles[y][x].cy = mapPixel.cy;

    this.tiles[y][x].setFillStyle(mapPixel.color.color);
    /*const selected = this.game.selection.isSelected(mapPixel.cx, mapPixel.cy);

    if (selected)
      this.tiles[y][x].setFillStyle(selected.color.color);
    else
      this.tiles[y][x].setFillStyle(mapPixel.color.color);*/

    /*if (this.game.mode !== 'move') { // Add stroke if mode is not move
      if (this.game.selection.isSelected(mapPixel.cx, mapPixel.cy))
        setInvertedStroke({ scene: this, tile: this.tiles[y][x] });
      else
        resetStrokeStyle({ scene: this, tile: this.tiles[y][x] });
    }*/
  }

  clearVisibleTiles() {
    logger.log("MainScene: clearVisibleTiles");

    this.tiles.forEach(y => {
      y.forEach(x => {
        x.destroy();
      });
    });

    this.tiles = [];

    return;
  }
}
