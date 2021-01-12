
import { numberToLetterColumn, formatColorNumber } from '@util/helpers';

export default class Pixel {

  constructor(tile) {
    this.tile = tile;
    this.color = Phaser.Display.Color.HexStringToColor('#' + formatColorNumber(this.tile.fillColor));
  }

  get position() {
    return numberToLetterColumn(this.cy) + this.cx;
  }

  get cx() {
    return this.tile.cx;
  }

  get cy() {
    return this.tile.cy;
  }

  get HEXcolor() {
    return formatColorNumber(this.tile.fillColor);
  }

  get title() {
    return this.position;
  }

  get y() {
    return this.tile.y;
  }

  get x() {
    return this.tile.x;
  }
}