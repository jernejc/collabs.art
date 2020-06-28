import Phaser from 'phaser'
import { ApplicationScene } from '@scenes/application_scene'

export class MinimapScene extends ApplicationScene {
  constructor(config) {
    super({ key: 'MinimapScene', active: true })
    this.config = config.appConfig;
    this.sceneConfig = config.sceneConfig;
  }

  create(data) {
    this.mainscene = this.game.scene.keys["MainScene"];
    this.sizeRatio = 4;

    this.width = 1000 / this.sizeRatio;
    this.height = 1000 / this.sizeRatio;

    this.minimap = this.add.image(this.width / 2, this.height / 2, 'worldmap');
    this.minimap.setDisplaySize(this.width, this.height);

    this.x = 10;
    this.y = this.config.canvasHeight - (this.height + 10);
    this.aspectRatio = this.config.canvasWidth / this.config.canvasHeight;
    this.minimapGridSize = Math.ceil(1000 / this.sceneConfig.gridWidth)

    // Main camera for scene
    this.cameras.main.setViewport(this.x, this.y, this.width, this.height);
    this.cameras.main.setBackgroundColor(0x000000);

    // Visible field box / mask
    this.fieldWidth = (this.minimapGridSize * this.sceneConfig.size) / this.sizeRatio // viewport width
    this.fieldHeight = ((this.minimapGridSize * this.sceneConfig.size) / this.aspectRatio) / this.sizeRatio // viewport height

    this.visibleField = this.add.rectangle(
      this.mainscene.cameraX / this.sizeRatio, // initial X position
      this.mainscene.cameraY / this.sizeRatio, // initial Y position
      this.fieldWidth,
      this.fieldHeight,
      Phaser.Display.Color.HexStringToColor('#ffffff').color, 0 // background color
    )

    // Setup alpha mask
    this.mapoverlay = this.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      Phaser.Display.Color.HexStringToColor('#000000').color
    )
    this.mapoverlay.setAlpha(0.75)
    this.mapoverlay.mask = new Phaser.Display.Masks.GeometryMask(this, this.visibleField)
    this.mapoverlay.mask.invertAlpha = true
	}

	update() {
    this.visibleField.setPosition((this.mainscene.cameraX / this.sizeRatio) + (this.fieldWidth / 2), (this.mainscene.cameraY / this.sizeRatio) + (this.fieldHeight / 2))
	}
}