
import Phaser from 'phaser';
import { handleMouseMove, handleMouseDown, handleMouseUp, setGameMode } from '@actions/user_interactions';
import { createPixel, colorPixel } from '@actions/pixel';
import { ApplicationScene } from '@scenes/application_scene';
import { MinimapScene } from '@scenes/minimap_scene';

export class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true });
  }

  preload() {
    //this.landColors = ['#8173BF', '#564D80', '#AC99FF', '#7C6DBF', '#9C8BE6'].map(color => Phaser.Display.Color.HexStringToColor(color).color)

    /*for (let x = 0; x < this.pMax; x++) {
      for (let y = 0; y < this.pMax; y++) {
        let colorIndex = Math.floor()
        this.worldmap[`${x}x${y}`] = this.landColors[colorIndex]
      }
    }*/

    this.load.image('worldmap', 'assets/images/milliondollarwebsite.png');
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
    this.color = new Phaser.Display.Color();

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
      console.log('wheel event', pointer, dx, dy, dz);

      const newSize = (dy < 0) ? this.size + 1 : this.size - 1;
      console.log("newSize", newSize);
     /*if (newSize > 5 && newSize < 35) {
        this.size = newSize;
        this.gridWidth = this.appConfig / this.size;
        this.gridHeight = window.innerHeight / this.size;

        this.updateLand()
      }*/
    });

    /** 
     * Keyboard events
     */

    this.input.keyboard.on('keydown_SHIFT', (event) => {
      console.log('keydown_SHIFT event', event, _self.game.mode);
      
      if (_self.game.mode === 'select')
        setGameMode({ scene: _self, mode: 'drag' });
    });

    this.input.keyboard.on('keyup_SHIFT', (event) => {
      console.log('keyup_SHIFT event', event, _self.game.mode);

      if (_self.game.mode === 'drag')
        setGameMode({ scene: _self, mode: 'select' });
    })

    this.game.emitter.on('scene/mode', (mode) => {
      console.log('this.game.emitter.on', mode);

      if (_self.game.mode !== mode)
        setGameMode({ scene: _self, mode: mode });
    });

    // Main scene is ready.
    this.game.emitter.emit('scene/ready');
  }

  updateLand() {
    //console.log("updateLand", this.gridWidth, this.gridHeight, this.cameraX, this.cameraY)
    for (let y = 0; y < this.gridHeight; y++) 
      for (let x = 0; x < this.gridWidth; x++) 
        colorPixel({x, y, scene: this});

    return;
  }

  createVisiblePixels() {

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.land[y])
        this.land[y] = [];

      for (let x = 0; x < this.gridWidth; x++) {
        this.land[y][x] = createPixel({x, y, scene: this});
        colorPixel({x, y, scene: this});
      }
    }

    return;
  }
}
