
import Phaser from 'phaser'
import { handleMove, handleClick, generalResetStrokeStyle, setGameMode, setCustomZoon } from '@scripts/actions/index'
import { ApplicationScene } from '@scenes/application_scene'
import { MinimapScene } from '@scenes/minimap_scene'

export class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true })
  }

  preload() {
    //this.landColors = ['#8173BF', '#564D80', '#AC99FF', '#7C6DBF', '#9C8BE6'].map(color => Phaser.Display.Color.HexStringToColor(color).color)

    /*for (let x = 0; x < this.pMax; x++) {
      for (let y = 0; y < this.pMax; y++) {
        let colorIndex = Math.floor()
        this.worldmap[`${x}x${y}`] = this.landColors[colorIndex]
      }
    }*/

    this.load.image('worldmap', 'assets/images/unicorn.png');
  }

  create(data) {
    super.create(data)

    //this.blockPadding = this.appConfig.blockPadding || 2
    this.size = this.appConfig.gridSize;
    this.strokeSize = this.appConfig.strokeSize;
    this.pixelSize = this.size + this.strokeSize;
    this.strokeColor = Phaser.Display.Color.HexStringToColor(this.appConfig.strokeColor);
    this.gridWidth = Math.ceil(this.appConfig.canvasWidth / this.size);
    this.gridHeight = Math.ceil(this.appConfig.canvasHeight / this.size);
    
    this.cameraX = 700;
    this.cameraY = 600;
    this.pMax = 1000;
    this.land = [];
    this.color = new Phaser.Display.Color();

    setGameMode({ scene: this, mode: "select" })

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
    })

    this.scene.add('MinimapScene', this.minimap, true);
    this.createVisiblePixels()

    this.input.on('pointermove', (pointer) => {
      handleMove({ pointer, scene: this })
      //console.log('MAINSCENE mouse move', pointer)
    })
    this.input.on('pointerdown', (pointer) => {
      handleClick({ pointer, scene: this })
      //console.log('MAINSCENE mouse move', pointer)
    })

    this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      console.log('wheel event', pointer, dx, dy, dz)

      const newSize = (dy < 0) ? this.size + 1 : this.size - 1;
      console.log("newSize", newSize)
     /*if (newSize > 5 && newSize < 35) {
        this.size = newSize;
        this.gridWidth = this.appConfig / this.size;
        this.gridHeight = window.innerHeight / this.size;

        this.updateLand()
      }*/
    })

    this.game.emitter.on('scene/mode', (mode) => {
      console.log('this.game.emitter.on', mode);

      if (mode == 'move')
        generalResetStrokeStyle(this)

      if (this.game.mode != mode)
        setGameMode({ scene: this, mode: mode })
    })

    this.game.emitter.emit('scene/ready');
  }

  updateLand() {
    //console.log("updateLand", this.gridWidth, this.gridHeight, this.cameraX, this.cameraY)
    for (let y = 0; y < this.gridHeight; y++) 
      for (let x = 0; x < this.gridWidth; x++) 
        this.colorPixel(x, y);

    return;
  }

  createVisiblePixels() {

    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.land[y])
        this.land[y] = []

      for (let x = 0; x < this.gridWidth; x++) {
        this.land[y][x] = this.createPixel(x, y);
        this.colorPixel(x, y);
      }
    }

    return;
  }

  createPixel(x, y) {
    //console.log('createPixel',x,y)
    const tx = this.size * x;
    const ty = this.size * y;
    //console.log('tx ty', tx, ty)

    const tile = this.add.rectangle(tx, ty, this.size, this.size);
    
    //if (this.strokeSize > 0)
    //  tile.setStrokeStyle(this.strokeSize, this.strokeColor.color, 0.2);

    return tile;
  }

  colorPixel(x, y) {
    //console.log('colorPixel')
    const color = this.getColor(x, y, this.color);
    this.land[y][x].setFillStyle(color.color);
  }

  getColor(x, y, color) {
    color = color || new Phaser.Display.Color();
    const cx = Phaser.Math.Wrap(this.cameraX + x, 0, this.imageWidth);
    const cy = Phaser.Math.Wrap(this.cameraY + y, 0, this.imageHeight);

    this.worldmap.getPixel(cx, cy, color);
    return color;
  }

  /*resizePixel(x, y) {
    const oldSize = this.land[y][x].width;

    if (oldSize != getFullBoxWidth(this)) {
      this.land[y][x].width = getFullBoxWidth(this);
      this.land[y][x].height = getFullBoxWidth(this);

      this.land[y][x].x = x * getFullBoxWidth(this);
      this.land[y][x].y = y * getFullBoxWidth(this);

      this.land[y][x].setDepth(getFullBoxWidth(this));
    }

    return;

    function getFullBoxWidth(self) {
      return self.size + self.strokeSize;
    }
  }*/
}
