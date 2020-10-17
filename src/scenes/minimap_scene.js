import Phaser from 'phaser'
import { ApplicationScene } from '@scenes/application_scene'

export class MinimapScene extends ApplicationScene {
  constructor(config) {
    super({ key: 'MinimapScene', active: true })
    this.appConfig = config.appConfig;
    this.sceneConfig = config.sceneConfig;
  }

  create(data) {
    this.mainscene = this.game.scene.keys["MainScene"];
    this.sizeRatio = 5;

    this.width = 1000 / this.sizeRatio;
    this.height = 1000 / this.sizeRatio;
    this.appConfig.canvasWidth / this.sceneConfig.size
    this.minimap = this.add.image(this.width / 2, this.height / 2, 'worldmap');
    this.minimap.setDisplaySize(this.width, this.height);

    this.x = 10;
    this.y = this.appConfig.canvasHeight - (this.height + 10);

    // Main camera for scene
    this.cameras.main.setViewport(this.x, this.y, this.width, this.height);
    this.cameras.main.setBackgroundColor(0x000000);

    // Visible field box / mask
    this.fieldWidth = (this.appConfig.canvasWidth / this.sceneConfig.size) / this.sizeRatio // viewport width
    this.fieldHeight = (this.appConfig.canvasHeight / this.sceneConfig.size) / this.sizeRatio // viewport height

    this.visibleField = this.add.rectangle(
      this.mainscene.cameraX / this.sizeRatio, // initial X position
      this.mainscene.cameraY / this.sizeRatio, // initial Y position
      this.fieldWidth,
      this.fieldHeight,
      Phaser.Display.Color.HexStringToColor('#ffffff').color, 0 // background color
    ).setStrokeStyle(0.5, Phaser.Display.Color.HexStringToColor('#ffffff').color, 0.8)

    // Setup alpha mask
    this.mapoverlay = this.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      Phaser.Display.Color.HexStringToColor('#000000').color
    )
    this.mapoverlay.setAlpha(0.82)
    this.mapoverlay.mask = new Phaser.Display.Masks.GeometryMask(this, this.visibleField)
    this.mapoverlay.mask.invertAlpha = true

    this.input.on('pointermove', (pointer) => {
      if (pointer.camera)
        if (DEBUG) console.log('MINIMAP pointerover', pointer)
    })
	}

	update() {
    this.visibleField.setPosition(
      (this.mainscene.cameraX / this.sizeRatio) + (this.fieldWidth / 2), 
      (this.mainscene.cameraY / this.sizeRatio) + (this.fieldHeight / 2)
    )
	}
}
