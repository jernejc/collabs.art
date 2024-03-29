import Pixel from "@models/pixel";

import { getTileForPointer, getTileForXY } from "@actions/pixel";
import { invertColor } from "@actions/general";

import { stringToHex } from "@util/helpers";
import logger from '@util/logger';

export default class SelectionManager {
  constructor(game, emitter) {
    logger.log("SelectionManager: constructor");

    this.game = game;
    this.emitter = emitter;

    this.pixels = [];
  }

  get activeSelection() {
    return this.pixels.filter(pixel => pixel.hasChanges);
  }

  get activeChangesCount() {
    return this.pixels.filter(pixel => pixel.hasChanges).length;
  }

  get activeFullBid() {
    return this.pixels.filter(pixel => pixel.hasChanges).reduce((aggregator, pixel) => {
      aggregator += pixel.bid;
      return aggregator;
    }, 0)
  }

  highlightTile({ pointer, scene }) {
    //logger.log("SelectionManager: highlightTile")

    const tile = getTileForPointer({ pointer, scene });
    const invertedColor = invertColor(tile.fillColor, true);

    this.highlight = scene.add.rectangle(
      tile.x,
      tile.y,
      scene.size,
      scene.size
    );
    this.highlight.setFillStyle(invertedColor.color, 0.15);
    this.highlight.setDisplayOrigin(0, 0);
    this.highlight.setDepth(1);
  }

  repositionHighlight({ pointer, scene }) {
    //logger.log("SelectionManager: repositionHighlight");

    const tile = getTileForPointer({ pointer, scene });

    if (!tile)
      return;

    const invertedColor = invertColor(tile.fillColor, true);

    this.highlight.setPosition(tile.x, tile.y);
    this.highlight.setFillStyle(invertedColor.color, 0.15);
  }

  async addSelected({ tiles, scene }) {
    logger.log("SelectionManager: addSelected");
    const added = [];

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      let pixel = this.isSelected(tile.cx, tile.cy);

      if (!pixel) {
        pixel = Pixel.fromTile({ tile, scene });

        const previous = this.pixels[0];

        if (previous && !previous.hasChanges && this.game.mode !== 'shiftdown') {
          previous.clearActivePixel();
          this.pixels.shift();
        }

        this.pixels.unshift(pixel);
      }

      // start loading graph data, but dont wait for it
      if (tiles.length === 1) pixel.loadGraphData();
      else pixel.loadingGraph = true;

      pixel.setActivePixel();
      added.push(pixel);
    }

    if (tiles.length > 1) this.updateGraphData();

    this.emitter.emit("selection/update", added);
  }

  selectRange({ startPixel, endPixel, scene }) {
    logger.log("SelectionManager: selectRange", startPixel, endPixel);

    let tiles = [],
      startX,
      endX,
      startY,
      endY;

    // It could be drawn up / down, left / right, calc req positions
    if (startPixel.tile.x > endPixel.tile.x) {
      startX = endPixel.tile.x;
      endX = startPixel.tile.x;
    } else {
      startX = startPixel.tile.x;
      endX = endPixel.tile.x;
    }

    if (startPixel.tile.y > endPixel.tile.y) {
      startY = endPixel.tile.y;
      endY = startPixel.tile.y;
    } else {
      startY = startPixel.tile.y;
      endY = endPixel.tile.y;
    }

    for (let y = startY; y < endY; y += scene.appConfig.gridSize)
      for (let x = startX; x < endX; x += scene.appConfig.gridSize)
        tiles.push(getTileForXY({ x, y, scene }));

    this.addSelected({ tiles, scene });
  }

  removeSelected({ tile }) {
    logger.log("SelectionManager: removeSelected");

    const pixel = this.isSelected(tile.cx, tile.cy);

    if (pixel) {
      this.pixels = this.pixels.filter((p) => {
        return !(p.cx === tile.cx && p.cy === tile.cy);
      });

      pixel.removeFromSelection();

      if (pixel.infobox) {
        this.game.tools.clearInfoBox();
      }

      this.emitter.emit("selection/update");
    }
  }

  isSelected(cx, cy) {
    const selected = this.pixels.find((pixel) => {
      return pixel.cx === cx && pixel.cy === cy;
    });

    return selected;
  }

  removeByReference(pixel) {
    logger.log("SelectionManager: removeByReference");

    this.pixels = this.pixels.filter((p) => {
      return !(p.cx === pixel.cx && p.cy === pixel.cy);
    });
  }

  async updateGraphData() {
    logger.log("SelectionManager: updateGraphData");

    const params = {
      first: this.pixels.length,
      id_in: `[${this.pixels
        .map((pixel) => `\"${stringToHex(pixel.position)}\"`)
        .join(",")}]` // GraphQL has this array thingy syntax
    };

    const graphData = await this.game.graph.loadPixels(params);

    this.pixels.forEach(pixel => {
      let data = graphData.find(
        data => `${stringToHex(pixel.position)}` === data.id
      );

      pixel.setGraphData(data);
    });

    this.game.emitter.emit("selection/update");
  }

  /* Rectangle drag selection */

  createRectangleSelection({ pointer, scene }) {
    logger.log("SelectionManager: createRectangleSelection");

    this.clearHighlight();
    this.clearRectangleSelection();

    const tile = getTileForPointer({ pointer, scene, color: true });

    this.rectangleSelectionBeginPixel = Pixel.fromTile({ tile, scene });

    const X = this.rectangleSelectionBeginPixel.x;
    const Y = this.rectangleSelectionBeginPixel.y;
    const W = pointer.x - this.rectangleSelectionBeginPixel.x;
    const H = pointer.y - this.rectangleSelectionBeginPixel.y;
    const invertedColor = invertColor(
      this.rectangleSelectionBeginPixel.color.color,
      true
    );

    this.rectangleSelection = scene.add.rectangle(X, Y, W, H);
    this.rectangleSelection.setFillStyle(invertedColor.color, 0.15);
    this.rectangleSelection.setStrokeStyle(1, invertedColor.color, 1);
    this.rectangleSelection.setDisplayOrigin(0, 0);
    this.rectangleSelection.setDepth(100);
  }

  resizeRectangleSelection({ pointer, scene }) {
    logger.log("SelectionManager: resizeRectangleSelection");

    const tile = getTileForPointer({ pointer, scene });

    this.rectangleSelectionEndPixel = Pixel.fromTile({ tile, scene });

    const W =
      this.rectangleSelectionEndPixel.x - this.rectangleSelectionBeginPixel.x;
    const H =
      this.rectangleSelectionEndPixel.y - this.rectangleSelectionBeginPixel.y;
    // Bug when changing rect size: https://phaser.discourse.group/t/how-to-resize-gameobjects-rectangle-without-changing-scale/4777
    this.rectangleSelection.geom.setSize(W, H);
    this.rectangleSelection.setSize(W, H);
    this.rectangleSelection.updateData();
  }

  refreshSelection() {
    this.pixels.forEach((pixel) => {
      pixel.refreshColor();
      pixel.setActivePixel();
    });
  }

  /* Clear selection(s) */

  clearBorders() {
    this.pixels.forEach((pixel) => pixel.clearActivePixel());
  }

  clearRectangleSelection() {
    if (!this.rectangleSelection) return;

    this.rectangleSelection.destroy();
    this.rectangleSelection = null;
    this.rectangleSelectionBeginPixel = null;
    this.rectangleSelectionEndPixel = null;
  }

  clearHighlight() {
    if (!this.highlight) return;

    this.highlight.destroy();
    this.highlight = null;
  }

  clearActiveSelection() {
    logger.log("SelectionManager: clearActiveSelection");

    const relevant = this.pixels.filter(pixel => {
      return !pixel.hasChanges;
    });

    relevant.forEach((pixel) => pixel.removeFromSelection());

    this.pixels = this.pixels.filter(pixel => {
      return pixel.hasChanges;
    });
  }

  clearAllSelection() {
    logger.log("SelectionManager: clearAllSelection");

    this.pixels.forEach((pixel) => pixel.removeFromSelection());

    this.pixels = [];

    this.emitter.emit("selection/clear");
  }

  reset() {
    logger.log("SelectionManager: Reset");

    this.clearHighlight();

    this.clearActiveSelection();

    this.clearRectangleSelection();
  }
}
