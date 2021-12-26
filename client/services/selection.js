import Pixel from "@models/pixel";

import { getTileForPointer } from "@actions/pixel";
import { invertColor } from "@actions/general";
import { stringToHex } from "@util/helpers";

export default class SelectionManager {
  constructor(game, emitter) {
    this.game = game;
    this.emitter = emitter;

    this.pixels = [];
  }

  highlightTile({ pointer, scene }) {
    if (DEBUG) console.log("SelectionManager: highlightTile");

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
    if (DEBUG) console.log("SelectionManager: repositionHighlight");

    const tile = getTileForPointer({ pointer, scene });
    const invertedColor = invertColor(tile.fillColor, true);

    this.highlight.setPosition(tile.x, tile.y);
    this.highlight.setFillStyle(invertedColor.color, 0.15);
  }

  async addSelected({ tiles, scene }) {
    if (DEBUG) console.log("SelectionManager: addSelected");

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];

      if (this.isSelected(tile.cx, tile.cy)) continue;

      const pixel = Pixel.fromTile({ tile, scene });

      // start loading graph data, but dont wait for it
      if (tiles.length === 1) pixel.loadGraphData();
      else pixel.loadingGraph = true;

      if (this.game.mode === "multiselect") this.pixels.unshift(pixel);
      else {
        if (this.pixels.length > 0) this.clearActiveSelection();

        this.pixels = [pixel];
      }

      pixel.setActivePixel();
    }

    if (tiles.length > 1) this.updateGraphData();

    this.emitter.emit("selection/update", this.pixels);
  }

  selectRange({ startPixel, endPixel, scene }) {
    if (DEBUG) console.log("SelectionManager: selectRange");

    let tiles = [],
      startX,
      endX,
      startY,
      endY;

    // It could be drawn up / down, left / right, calc req positions
    if (startPixel.cx > endPixel.cx) {
      startX = endPixel.cx;
      endX = startPixel.cx;
    } else {
      startX = startPixel.cx;
      endX = endPixel.cx;
    }

    if (startPixel.cy > endPixel.cy) {
      startY = endPixel.cy;
      endY = startPixel.cy;
    } else {
      startY = startPixel.cy;
      endY = endPixel.cy;
    }

    for (let y = startY; y < endY; y++)
      for (let x = startX; x < endX; x++) tiles.push(scene.tiles[y][x]);

    this.addSelected({ tiles, scene });
  }

  removeSelected({ tile, scene }) {
    if (DEBUG) console.log("SelectionManager: removeSelected");

    const pixel = Pixel.fromTile({ tile, scene });

    this.pixels = this.pixels.filter((p) => {
      return !(p.cx === tile.cx && p.cy === tile.cy);
    });

    pixel.clearActivePixel();
    pixel.resetColor();

    this.emitter.emit("selection/update", this.pixels);
  }

  isSelected(cx, cy) {
    const selected = this.pixels.find((pixel) => {
      return pixel.cx === cx && pixel.cy === cy;
    });

    return selected;
  }

  async updateGraphData() {
    if (DEBUG) console.log("SelectionManager: updateGraphData", this.pixels);

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
    if (DEBUG) console.log("SelectionManager: createRectangleSelection");

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
    if (DEBUG) console.log("SelectionManager: resizeRectangleSelection");

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

  /* Clear selection(s) */

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
    this.pixels.forEach((pixel) => {
      pixel.clearActivePixel();
      pixel.resetColor();
    });

    this.pixels = [];
    this.emitter.emit("selection/clear");
  }

  reset() {
    if (DEBUG) console.log("SelectionManager: Reset");

    this.clearHighlight();

    this.clearActiveSelection();

    this.clearRectangleSelection();
  }
}
