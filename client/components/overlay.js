import config from '@util/config';
import {
  setGameMode
} from '@actions/general';

import Slideshow from './slideshow';

export default class Overlay {
  constructor({ game, parent, close }) {
    if (DEBUG) console.log('Overlay: constructor');

    if (close)
      this.close = close;
    if (parent)
      this.parent = parent;
    if (game) {
      this.game = game;
      this.scene = this.game.scene.keys['MainScene'];
    }

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'overlay');

    this.setupDom();
  }

  setupDom() {
    this.slideshow = new Slideshow({ parent: this.domElement, game: this.game, buttonAction: this.close });
    this.parent.append(this.domElement);
  }

  destroy() {
    if (DEBUG) console.log("Overlay: destroy");

    if (this.slideshow)
      this.slideshow.destroy();

    if (this.parent)
      this.parent.removeChild(this.domElement);
  }

  startGameOfLife() {
    if (DEBUG) console.log("Overlay: startGameOfLife");

    this.scene.initialShapes = Object.keys(config.intialShapes);

    const halfWidth = Math.floor(this.scene.gridWidth * 0.5);
    const halfHeight = Math.floor(this.scene.gridHeight * 0.5);

    this.scene.xPadding = parseInt((halfWidth - this.scene.currentState['max-length']) * 0.6);
    this.scene.middleY = halfHeight;

    for (let y = 0; y < this.scene.gridHeight; y++) {
      for (let x = 0; x < this.scene.gridWidth; x++) {

        let probability = 0.12;

        if (this.scene.currentState) {
          const relativeY = this.scene.middleY - y;
          const relativeX = x - this.scene.xPadding;

          if (this.scene.currentState[relativeY] && this.scene.currentState[relativeY][relativeX])
            this.scene.tiles[y][x].intial = true;
        }

        if (this.scene.initialShapes.length > 0) { // increases probability instead of initial state..
          this.scene.initialShapes.forEach(shape => {
            const relativeY = this.scene.middleY - y;
            const relativeX = (config.intialShapes[shape].xPadding) ? x - config.intialShapes[shape].xPadding : x; // no padding for gliders

            if (
              config.intialShapes[shape][relativeY] &&
              config.intialShapes[shape][relativeY][relativeX]
            )
              probability = 1
          });
        }

        this.scene.tiles[y][x].alive = probability > Math.random();
      }
    }

    this.scene.timer = this.scene.time.addEvent({
      delay: 170,
      callback: this.scene.nextGeneration,
      callbackScope: this.scene,
      loop: true
    });

    setGameMode({ scene: this.scene, mode: 'gameoflife' });
  }

  stopGameOfLife() {
    if (DEBUG) console.log("Overlay: stopGameOfLife");

    for (let y = 0; y < this.scene.gridHeight; y++)
      for (let x = 0; x < this.scene.gridWidth; x++)
        this.scene.tiles[y][x].alive = null;

    if (scene.timer)
      this.scene.time.removeEvent(this.scene.timer);

    setGameMode({ scene: this.scene, mode: this.scene.appConfig.defaultMode });
  }

  isAlive(x, y) {
    if (DEBUG) console.log("Overlay: isAlive");

    if (x < 0 || x >= this.scene.gridWidth || y < 0 || y >= this.scene.gridHeight)
      return false;

    return this.scene.tiles[y][x].alive ? 1 : 0;
  }

  nextGeneration() {
    if (DEBUG) console.log("Overlay: nextGeneration");

    // Calculate next generation
    for (let x = 0; x < this.scene.gridWidth; x++) {
      for (let y = 0; y < this.scene.gridHeight; y++) {

        // Count the nearby population
        const aliveNeighbours = this.isAlive(x - 1, y - 1) +
          this.isAlive(x, y - 1) +
          this.isAlive(x + 1, y - 1) +
          this.isAlive(x - 1, y) +
          this.isAlive(x + 1, y) +
          this.isAlive(x - 1, y + 1) +
          this.isAlive(x, y + 1) +
          this.isAlive(x + 1, y + 1);

        const state = this.scene.tiles[y][x].alive;

        // Cell is lonely and dies
        if (state && (aliveNeighbours < 2))
          this.scene.tiles[y][x].nextState = false;

        // Cell dies due to over population
        else if (state && (aliveNeighbours > 3))
          this.scene.tiles[y][x].nextState = false;

        // A new cell is born
        else if (!state && (aliveNeighbours == 3))
          this.scene.tiles[y][x].nextState = true;

        // Remains the same
        else
          this.scene.tiles[y][x].nextState = state;
      }
    }

    // Apply the new state to the tiles
    for (let x = 0; x < this.scene.gridWidth; x++)
      for (let y = 0; y < this.scene.gridHeight; y++)
        this.scene.tiles[y][x].alive = this.scene.tiles[y][x].nextState;

    this.scene.updateTiles();
  }
}