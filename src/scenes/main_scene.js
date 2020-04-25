
import Phaser from 'phaser'
import { dragTool, createSelectionBlock, setGameMode, setCustomZoon } from '@scripts/actions/index'
import CustomPipeline from '@scripts/util/pipeline'
import { ApplicationScene } from '@scenes/application_scene'

export class MainScene extends ApplicationScene {
  constructor() {
    super({ key: 'MainScene', active: true })
  }

  preload() {
    this.load.image('terrain', 'assets/terrain2.png');
    // MINIMAP
    //this.minimapPipeline = this.game.renderer.addPipeline('Minimap', new CustomPipeline(this.game));
  }

  create(data) {
    super.create(data)

    setGameMode({ scene: this, mode: "move" })

    // Height settings
    this.color = new Phaser.Display.Color();
    this.size = 20;
    this.strokeSize = 1;
    this.gridWidth = window.innerWidth / this.size;
    this.gridHeight = window.innerHeight / this.size;
    this.px = 0;
    this.py = 0;
    this.pMax = 1000;
    this.land = []
    this.landColors = ['#8173BF','#564D80','#AC99FF','#7C6DBF','#9C8BE6'].map(color => Phaser.Display.Color.HexStringToColor(color).color)
    this.worldmap = {};

    for (let x = 0; x < this.pMax; x++) {
      for (let y = 0; y < this.pMax; y++) {
        for (let colorIndex = 0; colorIndex < this.landColors.length; colorIndex++) {
          if ((x+y) % colorIndex == 0)
            this.worldmap[`${x}x${y}`] = this.landColors[colorIndex]
        }
      }
    }

    console.log("worldmap length", Object.keys(this.worldmap).length, JSON.stringify(this.worldmap))

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
    console.log("updateLand", this.gridWidth, this.gridHeight, this.px, this.py)
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

    const tile = this.add.rectangle(tx, ty, this.size, this.size);
    tile.setStrokeStyle(this.strokeSize, Phaser.Display.Color.HexStringToColor('#dedede').color, 0.8);
    return tile;
  }

  colorPixel(x,y) {
    this.land[y][x].setFillStyle(this.worldmap[`${x}x${y}`]);
    return;
  }

  resizePixel(x,y) {
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
