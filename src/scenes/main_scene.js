
import Phaser from 'phaser'
import { dragTool, createSelectionBlock, setGameMode, setCustomZoon } from '@scripts/actions/index'
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

    this.load.image('worldmap', 'assets/images/terrain2-bw.png');
  }

  create(data) {
    super.create(data)

    this.blockPadding = this.appConfig.blockPadding || 2
    this.size = this.appConfig.gridSize;
    this.tileWidthHalf = parseInt(this.size / 1.8);
    this.tileHeightHalf = parseInt(this.size / 2.3);
    this.strokeSize = this.appConfig.strokeSize;
    this.gridWidth = this.appConfig.canvasWidth / (this.tileWidthHalf - this.blockPadding);
    this.gridHeight = this.appConfig.canvasHeight / (this.tileHeightHalf - this.blockPadding);
    this.px = 400;
    this.py = 400;
    this.pMax = 1000;
    this.hMax = 20;
    this.centerX = this.appConfig.canvasWidth / 2.0;
    this.centerY = -(this.appConfig.canvasHeight / 1.6);
    this.land = []
    this.color = new Phaser.Display.Color();

    setGameMode({ scene: this, mode: "move" })

    const src = this.textures.get('worldmap').getSourceImage();

    this.imageWidth = src.width;
    this.imageHeight = src.height;

    this.worldmap = this.textures.createCanvas('map', this.imageWidth, this.imageHeight);
    this.worldmap.draw(0, 0, src);
    console.log('this', this)

    //this.container = this.add.container(0, 0);
    this.minimap = new MinimapScene(this.appConfig)
    this.scene.add('MinimapScene', this.minimap, true);
    console.log("this.minimap", this.minimap);

    this.createVisiblePixels()

    this.input.on('pointermove', (pointer) => {
      dragTool({ pointer, scene: this })
      //console.log('mouse move', pointer)
    })

    this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      console.log('wheel event', pointer, dx, dy, dz)

      const newSize = (dy < 0) ? this.size + 1 : this.size - 1;
      console.log("newSize", newSize)
     /* if (newSize > 5 && newSize < 35) {
        this.size = newSize;
        this.gridWidth = this.appConfig / this.size;
        this.gridHeight = window.innerHeight / this.size;

        this.updateLand()
      }*/
    })

    this.game.emitter.emit('scene/ready')
  }

  updateLand() {
    //console.log("updateLand", this.gridWidth, this.gridHeight, this.px, this.py)
    for (let y = 0; y < this.gridHeight; y++) {
      //if (!this.land[y])
        //this.land[y] = []

      for (let x = 0; x < this.gridWidth; x++) {
        /*if (!this.land[y][x]) {
          console.log("Missing pixel, adding it!")
          let tile = this.createPixel(x, y)
          this.land[y][x] = tile
        }*/

        this.colorPixel(x, y);

        /*if (this.size != this.land[y][x].width)
          this.resizePixel(x, y)*/
      }
    }

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
    const tx = this.size * x //this.tileWidthHalf * x //(x - y) * this.tileWidthHalf // this.size * x;
    const ty = this.size * y //this.tileHeightHalf * y //(x + y) * this.tileHeightHalf //this.size * y;

    const tile = this.add.rectangle(tx, ty, this.size, this.size); // this.add.isobox(this.centerX + tx, this.centerY + ty, this.size, this.size); //this.add.rectangle(tx, ty, this.size, this.size);

    if (this.strokeSize > 0)
      tile.setStrokeStyle(this.strokeSize, Phaser.Display.Color.HexStringToColor('#dedede').color, 0.8);

    tile.setDepth(this.centerY + ty);
    //this.container.add(tile);

    return tile;
  }

  colorPixel(x, y) {
    const cx = Phaser.Math.Wrap(this.px + x, 0, this.imageWidth);
    const cy = Phaser.Math.Wrap(this.py + y, 0, this.imageHeight);

    this.worldmap.getPixel(cx, cy, this.color);

    /*const h = this.color.v * this.hMax;
    const top = this.color.color;
    const left = this.color.darken(30).color;
    const right = this.color.lighten(15).color;
    //console.log("colorPixel", top, right, left)
    this.land[y][x].setFillStyle(top, right, left);
    //this.land[y][x].setDepth(this.centerY + ty);
    this.land[y][x].height = h;*/
    this.land[y][x].setFillStyle(this.color.color);
  }

  resizePixel(x, y) {
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
  }
}
