
import Pixel from '@models/pixel';
import InfoBox from '@components/info_box';

import { getTileForXY, getTileForPointer } from '@actions/pixel';
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

    let tile; 

    if (this.activeTile) // Active tile is used to highlight the current selection, we need the underlying tile, to get the pixel reference
      tile = getTileForXY({ x: this.activeTile.x, y: this.activeTile.y, scene, color: true });
    /*else if (this.rectangleSelection)
      selection = [
        getTileForXY({ x: this.rectangleSelectionBeginPixel.x, y: this.rectangleSelectionBeginPixel.y, scene, color: true }),
        getTileForXY({ x: this.rectangleSelectionEndPixel.x, y: this.rectangleSelectionEndPixel.y, scene, color: true })
      ]*/

    if (this.infobox)
      this.clearInfoBox();

    this.infobox = new InfoBox({ pixel: new Pixel(tile), parent: this.parent, scene });

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

  highlightTile({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: highlightTile');

    const tile = getTileForPointer({ pointer, scene });
    const invertedColor = invertColor(tile.fillColor, true);

    this.highlight = scene.add.rectangle(tile.x, tile.y, scene.size, scene.size);
    this.highlight.setFillStyle(invertedColor.color, 0.15);
    this.highlight.setDisplayOrigin(0, 0);
    this.highlight.setDepth(1);
  }

  repositionHighlight({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: repositionHighlight');

    const tile = getTileForPointer({ pointer, scene });
    const invertedColor = invertColor(tile.fillColor, true);

    this.highlight.setPosition(tile.x, tile.y);
    this.highlight.setFillStyle(invertedColor.color, 0.15);
  }

  async setActiveTile({ tile, scene }) {
    /*if (DEBUG)*/ console.log('SelectionManager: setActiveTile');

    console.log('SelectionManager: setActiveTile tile', tile);

    /*if (this.rectangleSelection)
      this.clearRectangleSelection();*/
    if (this.activeTile)
      this.clearActiveTile();

    const invertedColor = invertColor(tile.fillColor, true);

    this.activeTile = scene.add.rectangle(tile.x, tile.y, scene.size, scene.size);
    this.activeTile.setStrokeStyle(1, invertedColor.color, 0.9);
    this.activeTile.setDisplayOrigin(0, 0);
    this.activeTile.setDepth(1);

    await this.displayInfoBox({ scene });
  }

  /*createRectangleSelection({ pointer, scene }) {
    if (DEBUG) console.log('SelectionManager: createRectangleSelection');

    const pixel = getTileForPointer({ pointer, scene, color: true });

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

    this.rectangleSelectionEndPixel = getTileForPointer({ pointer, scene });

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
  }*/

  clearHighlight() {
    this.highlight.destroy();
    this.highlight = null;
  }

  clearActiveTile() {
    this.activeTile.destroy();
    this.activeTile = null;
  }

  clearInfoBox() {
    this.infobox.destroy();
    this.infobox = null;
  }

  reset() {
    if (DEBUG) console.log('SelectionManager: Reset');

    if (this.highlight)
      this.clearHighlight();

    if (this.activeTile)
      this.clearActiveTile();

    /*if (this.rectangleSelection)
      this.clearRectangleSelection();*/

    if (this.infobox)
      this.clearInfoBox();
  }

  /*isSelected(tile) {
    //if (DEBUG) console.log('isSelected', tile)
    return this.ids.includes(tile.id);
  }

  get ids() {
    return this.selection.map(pixel => pixel.tile.id);
  }*/

}