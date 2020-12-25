
import Selection from '@components/selection';
import InfoBox from '@components/info_box';

import { getPixelForXY, getPixelForPointer } from '@actions/pixel';
import { invertColor } from '@actions/user_interactions';

export default class SelectionManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.selection = [];
    this.infobox = null;
    this.parent = document.body.querySelector('#game');
    
    this.enableEvents();
  }

  async displayInfoBox({ scene }) {
    if (DEBUG) console.log('SelectionManager: displayInfoBox');

    let selection;

    if (this.singleSelection)
      selection = [getPixelForXY({ x: this.singleSelection.x, y: this.singleSelection.y, scene, color: true })]
    else if (this.rectangleSelection)
      selection = [
        getPixelForXY({ x: this.rectangleSelectionBeginPixel.x, y: this.rectangleSelectionBeginPixel.y, scene, color: true }),
        getPixelForXY({ x: this.rectangleSelectionEndPixel.x, y: this.rectangleSelectionEndPixel.y, scene, color: true })
      ]

    if (this.infobox)
      this.clearInfoBox();

    this.infobox = new InfoBox({ selection: new Selection(selection, this.parent), parent: this.parent, scene });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  enableEvents() {
    this.emitter.on('web3/address', async address => {
      if (DEBUG) console.log('SelectionManager: on web3/address emitter', address);
      
      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });
  }

  createHighlightSelection({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: createHighlightSelection');

    const pixel = getPixelForPointer({ pointer, scene, color: true });

    const X = pixel.tile.x;
    const Y = pixel.tile.y;

    const invertedColor = invertColor(pixel.color.color, true);

    this.highlightSelection = scene.add.rectangle(X, Y, scene.size, scene.size);
    this.highlightSelection.setFillStyle(invertedColor.color, 0.15);
    this.highlightSelection.setDisplayOrigin(0, 0);
    this.highlightSelection.setDepth(1);
  }

  repositionHighlightSelection({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: repositionHighlightSelection');

    const pixel = getPixelForPointer({ pointer, scene, color: true });

    const X = pixel.tile.x;
    const Y = pixel.tile.y;

    const invertedColor = invertColor(pixel.color.color, true);

    this.highlightSelection.setPosition(X, Y);
    this.highlightSelection.setFillStyle(invertedColor.color, 0.15);
  }

  async createSingleSelection({ pixel, scene }) {
    if (DEBUG) console.log('SelectionManager: createSingleSelection');

    if (this.rectangleSelection)
      this.clearRectangleSelection();
    if (this.singleSelection)
      this.clearSingleSelection();

    const X = pixel.tile.x;
    const Y = pixel.tile.y;

    const invertedColor = invertColor(pixel.color.color, true);

    this.singleSelection = scene.add.rectangle(X, Y, scene.size, scene.size);
    this.singleSelection.setStrokeStyle(1, invertedColor.color, 0.9);
    this.singleSelection.setDisplayOrigin(0, 0);
    this.singleSelection.setDepth(1);

    await this.displayInfoBox({ scene });
  }

  createRectangleSelection({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: createRectangleSelection');

    const pixel = getPixelForPointer({ pointer, scene, color: true });

    this.rectangleSelectionBeginPixel = pixel.tile

    const X = this.rectangleSelectionBeginPixel.x;
    const Y = this.rectangleSelectionBeginPixel.y;
    const W = pointer.x - this.rectangleSelectionBeginPixel.x;
    const H = pointer.y - this.rectangleSelectionBeginPixel.y;

    const invertedColor = invertColor(pixel.color.color, true);

    this.rectangleSelection = scene.add.rectangle(X, Y, W, H);
    this.rectangleSelection.setFillStyle(invertedColor.color, 0.15);
    this.rectangleSelection.setStrokeStyle(1, invertedColor.color, 0.9);
    this.rectangleSelection.setDisplayOrigin(0, 0);
    this.rectangleSelection.setDepth(100);
  }

  resizeRectangleSelection({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: resizeRectangleSelection');

    this.rectangleSelectionEndPixel = getPixelForPointer({ pointer, scene });

    const W = this.rectangleSelectionEndPixel.x - this.rectangleSelectionBeginPixel.x;
    const H = this.rectangleSelectionEndPixel.y - this.rectangleSelectionBeginPixel.y;

    // Bug when changing rect size: https://phaser.discourse.group/t/how-to-resize-gameobjects-rectangle-without-changing-scale/4777
    this.rectangleSelection.geom.setSize(W, H);
    this.rectangleSelection.setSize(W, H);
    this.rectangleSelection.updateData();
  }

  clearRectangleSelection() {
    this.rectangleSelection.destroy();
    this.rectangleSelection = null;
    this.rectangleSelectionBeginPixel = null;
    this.rectangleSelectionEndPixel = null;
  }

  clearHighlightSelection() {
    this.highlightSelection.destroy();
    this.highlightSelection = null;
  }

  clearSingleSelection() {
    this.singleSelection.destroy();
    this.singleSelection = null;
  }

  clearInfoBox() {
    this.infobox.destroy();
    this.infobox = null;
  }

  reset() {
    if (DEBUG) console.log('SelectionManager: Reset');

    if (this.highlightSelection)
      this.clearHighlightSelection();

    if (this.singleSelection)
      this.clearSingleSelection();

    if (this.rectangleSelection)
      this.clearRectangleSelection();

    if (this.infobox)
      this.clearInfoBox();
  }

  isSelected(tile) {
    //if (DEBUG) console.log('isSelected', tile)
    return this.ids.includes(tile.id);
  }

  get ids() {
    return this.selection.map(pixel => pixel.tile.id);
  }

}