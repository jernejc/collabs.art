
import Pixel from '@models/pixel';
import InfoBox from '@components/info_box';

import { getTileForPointer } from '@actions/pixel';
import { invertColor } from '@actions/user_interactions';

export default class SelectionManager {

  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.pixels = [];
    this.infobox = null;
    this.parent = document.body.querySelector('#game');

    this.enableEvents();
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

  async setActivePixel({ tile, scene }) {
    if (DEBUG) console.log('SelectionManager: setActivePixel');

    if (this.isSelected(tile.cx, tile.cy))
      return;

    const pixel = Pixel.fromTile({ tile, scene });

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

    if (this.infobox)
      this.clearInfoBox();

    if (this.pixels.length === 1) {
      this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, scene });

      // Init is async, not sure if this is best approach
      await this.infobox.init();
    } else if (this.pixels.length > 1) {
      if (!scene.game.tools.menu || !scene.game.tools.menu.loaded)
        await scene.game.tools.openMenu('selection');
    }
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

  clearInfoBox() {
    this.infobox.destroy();
    this.infobox = null;
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

    if (this.infobox)
      this.clearInfoBox();

    if (this.pixels.length > 0)
      this.clearActivePixels();
  }
}