import Phaser from 'phaser'

export class ApplicationScene extends Phaser.Scene {
  constructor(options = undefined) {
    super(options)
  }

  create(params = {}) {
    this.currentScene = this
  }

  exportToBase64() {
    return new Promise((resolve, reject) => {
      this.renderer.snapshot((data) => {
        resolve(data.src)
      })
    })
  }
}
