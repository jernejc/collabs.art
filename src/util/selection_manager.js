
import Contract from '@components/contract';
import InfoBox from '@components/info_box';

import { getPixelForPointer } from '@actions/pixel';

export default class SelectionManager {

  constructor() {
    this.selection = [];
    this.infobox = null;
    this.parent = document.body.querySelector('#game');
  }

  create(pixels, scene) {
    console.log('SelectionManager add', pixels);

    if (!pixels || pixels.length === 0)
      return;

    if (pixels.length === 1) { // single pixel
      this.selection = pixels;
    } else if (pixels.length > 1) { // selection of pixels
      this.selection = pixels;
    }

    this.infobox = new InfoBox({ contract: new Contract(this.selection, this.parent), parent: this.parent, scene });
    //console.log('this.selection', this.selection);
  }

  createRectangle({ pointer, scene }) {
    this.rectangleBeginPixel = getPixelForPointer({ pointer, scene });
  
    const X = this.rectangleBeginPixel.x;
    const Y = this.rectangleBeginPixel.y;
    const W = pointer.x - this.rectangleBeginPixel.x;
    const H = pointer.y - this.rectangleBeginPixel.y;
  
    this.rectangle = scene.add.rectangle(X, Y, W, H);
    this.rectangle.setFillStyle(0xffffff, 0.15);
    this.rectangle.setStrokeStyle(1, 0xffffff, 0.9);
    this.rectangle.setDisplayOrigin(0, 0);
    this.rectangle.setDepth(100);
  }

  resizeRectangle({ pointer, scene }) {
    this.rectangleEndPixel = getPixelForPointer({ pointer, scene });
  
    const W = this.rectangleEndPixel.x - this.rectangleBeginPixel.x;
    const H = this.rectangleEndPixel.y - this.rectangleBeginPixel.y;
  
    // Bug when changing rect size: https://phaser.discourse.group/t/how-to-resize-gameobjects-rectangle-without-changing-scale/4777
    this.rectangle.geom.setSize(W, H);
    this.rectangle.setSize(W, H);
    this.rectangle.updateData();
  }

  clearRectangle() {
    if (this.rectangle) {
      this.rectangle.destroy();
      this.rectangle = null;
      this.rectangleBeginPixel = null;
      this.rectangleEndPixel = null;
    }
  }

  reset() {
    console.log('reset selection', this.selection);

    clearRectangle();
    this.infobox.destroy();
  }

  isSelected(tile) {
    //console.log('isSelected', tile)
    return this.ids.includes(tile.id);
  }

  get ids() {
    return this.selection.map(pixel => pixel.tile.id);
  }

}