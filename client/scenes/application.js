export default class ApplicationScene extends Phaser.Scene {
  constructor(options = undefined) {
    super(options);
  }

  create() {
    this.appConfig = this.game.appConfig;
  }

  exportToBase64() {
    return new Promise((resolve) => {
      this.renderer.snapshot((data) => {
        resolve(data.src);
      });
    });
  }
}
