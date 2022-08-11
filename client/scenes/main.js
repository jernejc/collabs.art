import _ from 'lodash';

import config from '@util/config';

import { hexStringToColor } from '@util/helpers';
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

export default class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true });
  }

  preload() {
    this.load.image('worldimage', 'assets/images/place.png'); //this.load.image('worldimage', `${config.events.url}/image`);
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
      if (!this.game.tools.overlay)
        this.openOverlay();
      else
        this.closeOverlay();
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
        setGameMode({ scene: this, mode: 'select' });
      } else
        setGameMode({ scene: this, mode: 'select' });
    }

    //window.addEventListener('resize', this.resize.bind(this));
  }

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

    /*if (this.game.mode !== 'move') { // Add stroke if mode is not move
      if (this.game.selection.isSelected(mapPixel.cx, mapPixel.cy))
        setInvertedStroke({ scene: this, tile: this.tiles[y][x] });
      else
        resetStrokeStyle({ scene: this, tile: this.tiles[y][x] });
    }*/
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

  openOverlay() {
    /*if (DEBUG)*/ console.log("Main Scene: openOverlay");

    this.currentState = config.intialGameState['contribute'];

    //this.game.tools.hideTools();
    this.game.tools.openOverlay();
  }

  closeOverlay() {
    /*if (DEBUG)*/ console.log("Main Scene: closeOverlay");

    //this.updateTiles();
    this.game.tools.clearOverlay();
    //this.game.tools.showTools();
  }
}
