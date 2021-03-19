
import Pixel from '@models/pixel';

import { getTileForPointer } from '@actions/pixel';
import { invertColor } from '@actions/general';

export default class SelectionManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.pixels = [];
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

  async addSelection(pixel) {
    if (this.game.mode === 'multiselect')
      this.pixels.unshift(pixel);
    else {
      if (this.pixels.length > 0)
        this.clearActivePixels();

      this.pixels = [pixel];
    }

    await pixel.loadGraphData();
    pixel.setActivePixel();

    this.game.emitter.emit('selection/update', this.pixels);
  }

  removeSelected({ tile, scene }) {
    const pixel = Pixel.fromTile({ tile, scene });

    this.pixels = this.pixels.filter(p => {
      return !(p.cx === tile.cx && p.cy === tile.cy);
    });

    pixel.clearActivePixel();

    this.game.emitter.emit('selection/update', this.pixels);
  }

  isSelected(cx, cy) {
    const selected = this.pixels.find(pixel => {
      return pixel.cx === cx && pixel.cy === cy;
    });

    return (selected);
  }

  clearHighlight() {
    this.highlight.destroy();
    this.highlight = null;
  }

  clearActivePixels() {
    this.pixels.forEach(pixel => {
      pixel.clearActivePixel();
    });
  }

  reset() {
    if (DEBUG) console.log('SelectionManager: Reset');

    if (this.highlight)
      this.clearHighlight();

    if (this.pixels.length > 0)
      this.clearActivePixels();
  }
}