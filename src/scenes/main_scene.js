
import Phaser from 'phaser'
import { dragTool, createSelectionBlock, setGameMode } from '@scripts/actions/index'
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

    console.log('main_scene create', this)
    setGameMode({ scene: this, mode: 'move' })

    const src = this.textures.get('terrain').getSourceImage();

    // Height settings
    this.color = new Phaser.Display.Color();
    this.size = 10;
    this.gridWidth = window.innerWidth / this.size;
    this.gridHeight = window.innerHeight / this.size;
    this.tileWidthHalf = 5;
    this.tileHeightHalf = 3;
    this.centerX = (window.innerWidth / 2) - this.gridWidth;
    this.centerY = (window.innerHeight / 2) - this.gridHeight;
    this.maxHeight = 20;
    this.px = 0;
    this.py = 0;
    this.land = []

    console.log('gridWidth, gridHeight', this.gridWidth, this.gridHeight)

    this.imageWidth = src.width;
    this.imageHeight = src.height;

    console.log('imageWidth, imageHeight', this.gridWidth, this.gridHeight)
    
    this.heightmap = this.textures.createCanvas('map', this.imageWidth, this.imageHeight);
    this.heightmap.draw(0, 0, src);

    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];

      for (let x = 0; x < this.gridWidth; x++) {
        const tx = (x - y) * this.tileWidthHalf;
        const ty = (x + y) * this.tileHeightHalf;

        const tile = this.add.isobox(this.centerX + tx, this.centerY + ty, this.size, this.size, 0x8dcb0e, 0x3f8403, 0x63a505);

        //tile.setDepth(this.centerY + ty);

        row.push(tile);
      }

      this.land.push(row);
    }

    this.updateLand();

    //this.camera = this.cameras.main;
    //this.camera.setBounds(-400, -200, window.innerWidth, window.innerHeight).setName('main');

    //  The miniCam is 400px wide, so can display the whole world at a zoom of 0.2
    //this.minimap = this.cameras.add(5, 5, 400, 200).setZoom(0.1).setName('mini');
    //this.minimap.setBackgroundColor(0x002244);
    //this.minimap.scrollX = 0;
    //this.minimap.scrollY = 0;

    console.log('calling updateEnvironment in main scene')
    //this.updateEnvironment(); // The core method responsible for displaying/destroying chunks

    // KEYBOARD EVENTS

    this.input.keyboard.on('keydown-S', event => {
      console.log('keydown S', event, this.input)
      setGameMode({ scene: this, mode: 'select' })
    })

    this.input.keyboard.on('keydown-M', event => {
      console.log('keydown M', event, this.input)
      setGameMode({ scene: this, mode: 'move' })
    })

    // Register the PointerMove event
    this.input.on('pointermove', (pointer) => {
      dragTool({ pointer, scene: this })
      //console.log('mouse move', pointer)
    })

    this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
      console.log('wheel event', pointer, dx, dy, dz)
      console.log('camera', this.camera)

      //setCameraZoom({ camera: this.camera, dy })
    })

    this.game.emitter.emit('scene/ready')
  }

  update() {

  }

  updateLand() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cx = Phaser.Math.Wrap(this.px + x, 0, this.imageWidth);
        const cy = Phaser.Math.Wrap(this.py + y, 0, this.imageHeight);

        this.heightmap.getPixel(cx, cy, this.color);

        const h = this.color.v * this.maxHeight;
        const top = this.color.color;
        const left = this.color.darken(30).color;
        const right = this.color.lighten(15).color;

        this.land[y][x].setFillStyle(top, left, right);
        this.land[y][x].height = h;
      }
    }
  }
}
