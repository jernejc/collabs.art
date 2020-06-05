import Phaser from 'phaser'
import { ApplicationScene } from '@scenes/application_scene'

export class MinimapScene extends ApplicationScene {
  constructor(config) {
    console.log('MinimapScene config', config)
    super({ key: 'MinimapScene', active: true })
    this.config = config;
  }

  create(data) {
    //console.log("Minimap scene create", this, this.x, this.y, this.width, this.height)
    this.sizeRatio = 4;
    this.minimap = this.add.image(0, 0, 'worldmap').setAlpha(0.2);
    console.log("minimap". minimap)
    //this.minimap.width = this.width;
    //this.minimap.height = this.height;

    // Calculate width/height and position
    
    this.width = this.minimap.width / this.sizeRatio;
    this.height = this.minimap.height / this.sizeRatio;
    this.x = (this.config.canvasWidth / 2) - (this.width / 2);
    this.y = this.config.canvasHeight - this.height;

    this.cameras.main.setViewport(this.x, this.y, this.width, this.height);
    this.cameras.main.setBackgroundColor(0x000000);

    this.visibleField = this.add.rectangle(100, 100, this.width / this.sizeRatio, this.height / this.sizeRatio, Phaser.Display.Color.HexStringToColor('#dedede').color, 0.2)
    this.visibleField.strokeColor = Phaser.Display.Color.HexStringToColor('#dedede').color;
    this.visibleField.strokeAlpha = 0.5;
	}

	update() {
    /*console.log("Minimap scene update", this.game.scene.keys["MainScene"].px, this.game.scene.keys["MainScene"].py, this.minimap)
    this.minimap.displayWidth = this.width
    this.minimap.displayHeight = this.height*/
    this.visibleField.setPosition(this.game.scene.keys["MainScene"].px / this.sizeRatio, this.game.scene.keys["MainScene"].py / this.sizeRatio)
	}
}