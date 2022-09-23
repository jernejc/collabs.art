
import ApplicationScene from '@scenes/application';
import { setGameMode } from '@actions/general';
import logger from '@util/logger';

export default class MinimapScene extends ApplicationScene {
  constructor(config, wrapper) {
    logger.log('MinimapScene: constructor');

    super({ key: 'MinimapScene', active: true });

    this.appConfig = config.appConfig;
    this.sceneConfig = config.sceneConfig;
    this.wrapper = wrapper;
  }

  create() {
    this.mainscene = this.game.scene.keys["MainScene"];

    this.appConfig.canvasWidth / this.sceneConfig.size;
    this.worldmap = this.add.image(this.sceneConfig.width / 2, this.sceneConfig.height / 2, 'worldmap');
    this.worldmap.setDisplaySize(this.sceneConfig.width, this.sceneConfig.height);

    // Main camera for scene
    this.cameras.main.setViewport(this.sceneConfig.x, this.sceneConfig.y, this.sceneConfig.width, this.sceneConfig.height);
    //this.cameras.main.setBackgroundColor(0x000000);

    // Setup alpha mask
    this.mapoverlay = this.add.rectangle(
      this.sceneConfig.width / 2,
      this.sceneConfig.height / 2,
      this.sceneConfig.width,
      this.sceneConfig.height,
      0x000000,
      0.7
    )

    // Visible field box / mask
    this.fieldWidth = (this.appConfig.canvasWidth / this.sceneConfig.size) / this.sceneConfig.sizeRatio // viewport width
    this.fieldHeight = (this.appConfig.canvasHeight / this.sceneConfig.size) / this.sceneConfig.sizeRatio // viewport height

    this.visibleField = this.add.rectangle(
      this.mainscene.cameraX / this.sceneConfig.sizeRatio, // initial X position
      this.mainscene.cameraY / this.sceneConfig.sizeRatio, // initial Y position
      this.fieldWidth,
      this.fieldHeight,
      0xFFFFFF,
      1
    );
    this.visibleField.setAlpha(0);
    this.visibleField.setStrokeStyle(1, 0xe59500, 1);

    this.mapoverlay.mask = new Phaser.Display.Masks.GeometryMask(this, this.visibleField);
    this.mapoverlay.mask.setInvertAlpha(true);

    let prevMode; // TO-DO: needs a more general solution

    this.wrapper.on('pointerover', () => {
      logger.log('MinimapScene: pointerover');

      prevMode = this.game.mode;
      setGameMode({ scene: this, mode: 'mininav' });
      //this.game.tools.showExpandBtn();
    });

    this.wrapper.on('pointerout', () => {
      logger.log('MinimapScene: pointerout');

      setGameMode({ scene: this, mode: this.mainscene.appConfig.defaultMode });
      //this.game.tools.hideExpandBtn();
    });
  }

  update() {
    this.visibleField.setPosition(
      (this.mainscene.cameraX / this.sceneConfig.sizeRatio) + (this.fieldWidth / 2),
      (this.mainscene.cameraY / this.sceneConfig.sizeRatio) + (this.fieldHeight / 2)
    );
  }
}
