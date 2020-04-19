
import Phaser from 'phaser'
import { dragTool, createSelectionBlock, setGameMode, setCustomZoon } from '@scripts/actions/index'
import { ApplicationScene } from '@scenes/application_scene'

export class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true })
  }

  preload() {
    this.load.image('terrain', 'assets/terrain2.png');
  }

  create(data) {
    super.create(data)

    setGameMode({ scene: this, mode: "move" })

    // Height settings
    this.color = new Phaser.Display.Color();
    this.size = 20;
    this.gridWidth = window.innerWidth / this.size;
    this.gridHeight = window.innerHeight / this.size;
    this.px = 0;
    this.py = 0;
    this.land = []

    const src = this.textures.get('terrain').getSourceImage();
    this.imageWidth = src.width;
    this.imageHeight = src.height;
    
    this.heightmap = this.textures.createCanvas('map', this.imageWidth, this.imageHeight);
    this.heightmap.draw(0, 0, src);

    this.createVisiblePixels()

    this.input.on('pointermove', (pointer) => {
      dragTool({ pointer, scene: this })
      //console.log('mouse move', pointer)
    })

    this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      console.log('wheel event', pointer, dx, dy, dz)

      const newSize = (dy < 0) ? this.size + 1 : this.size - 1;
      console.log("newSize", newSize)
      if (newSize > 5 && newSize < 35) {
        this.size = newSize;
        this.gridWidth = window.innerWidth / this.size;
        this.gridHeight = window.innerHeight / this.size;
  
        this.updateLand()
      }
    })

    this.game.emitter.emit('scene/ready')
  }

  updateLand() {
    console.log("updateLand", this.gridWidth, this.gridHeight)
    for (let y = 0; y < this.gridHeight; y++) {
      if (!this.land[y])
        this.land[y] = []

      for (let x = 0; x < this.gridWidth; x++) {
        if (!this.land[y][x]) {
          console.log("Missing pixel, adding it!")
          let tile = this.addPixel(x,y)
          this.land[y][x] = tile
        }

        this.colorPixel(x, y);

        if (this.size != this.land[y][x].width) 
          this.resizePixel(x,y)
      }
    }

    return;
  }

  createVisiblePixels() {

    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];

      for (let x = 0; x < this.gridWidth; x++) {
        let tile = this.addPixel(x,y);
        row.push(tile)
      }

      this.land.push(row);
    }

    this.updateLand();

    return;
  }

  addPixel(x,y) {
    const tx = this.size * x;
    const ty = this.size * y;

    return this.add.rectangle(tx, ty, this.size, this.size);
  }

  colorPixel(x,y) {
    const cx = Phaser.Math.Wrap(this.px + x, 0, this.imageWidth);
    const cy = Phaser.Math.Wrap(this.py + y, 0, this.imageHeight);

    this.heightmap.getPixel(cx, cy, this.color);
    this.land[y][x].setFillStyle(this.color.color);

    return;
  }

  resizePixel(x,y) {
    const oldSize = this.land[y][x].width;

    if (oldSize != this.size) {
      this.land[y][x].width = this.size;
      this.land[y][x].height = this.size;

      this.land[y][x].x = x * this.size;
      this.land[y][x].y = y * this.size;

      this.land[y][x].setDepth(this.size);
    }

    return;
  }
}
