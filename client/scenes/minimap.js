import Phaser from 'phaser';

import ApplicationScene from '@scenes/application';
import { setGameMode } from '@actions/user_interactions';

export default class MinimapScene extends ApplicationScene {
  constructor(config, wrapper) {
    super({ key: 'MinimapScene', active: true });

    this.appConfig = config.appConfig;
    this.sceneConfig = config.sceneConfig;
    this.wrapper = wrapper;
  }

  create() {
    this.mainscene = this.game.scene.keys["MainScene"];

    this.appConfig.canvasWidth / this.sceneConfig.size;
    this.worldmap = this.add.image(parseInt(this.sceneConfig.width / 2), parseInt(this.sceneConfig.height / 2), 'worldmap');
    this.worldmap.setDisplaySize(this.sceneConfig.width, this.sceneConfig.height);

    // Main camera for scene
    this.cameras.main.setViewport(this.sceneConfig.x, this.sceneConfig.y, this.sceneConfig.width, this.sceneConfig.height);
    //this.cameras.main.setBackgroundColor(0x000000);

    // Visible field box / mask
    this.fieldWidth = (this.appConfig.canvasWidth / this.sceneConfig.size) / this.sceneConfig.sizeRatio // viewport width
    this.fieldHeight = (this.appConfig.canvasHeight / this.sceneConfig.size) / this.sceneConfig.sizeRatio // viewport height

    this.visibleField = this.add.rectangle(
      this.mainscene.cameraX / this.sceneConfig.sizeRatio, // initial X position
      this.mainscene.cameraY / this.sceneConfig.sizeRatio, // initial Y position
      this.fieldWidth,
      this.fieldHeight,
      Phaser.Display.Color.HexStringToColor('#ffffff').color, 0 // background color
    ).setStrokeStyle(0.5, Phaser.Display.Color.HexStringToColor('#ffffff').color, 1)

    // Setup alpha mask
    this.mapoverlay = this.add.rectangle(
      this.sceneConfig.width / 2,
      this.sceneConfig.height / 2,
      this.sceneConfig.width,
      this.sceneConfig.height,
      Phaser.Display.Color.HexStringToColor('#000000').color
    );

    this.mapoverlay.setAlpha(0.6);
    this.mapoverlay.mask = new Phaser.Display.Masks.GeometryMask(this, this.visibleField);
    this.mapoverlay.mask.invertAlpha = true;

    let prevMode; // TO-DO: needs a more general solution

    this.wrapper.on('pointerover', () => {
      prevMode = this.game.mode;
      setGameMode({ scene: this, mode: 'mininav' });
    });

    this.wrapper.on('pointerout', () => {
      setGameMode({ scene: this, mode: prevMode });
    });
  }

  update() {
    this.visibleField.setPosition(
      (this.mainscene.cameraX / this.sceneConfig.sizeRatio) + (this.fieldWidth / 2),
      (this.mainscene.cameraY / this.sceneConfig.sizeRatio) + (this.fieldHeight / 2)
    );
  }
}
