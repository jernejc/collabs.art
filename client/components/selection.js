
import { numberToLetterColumn, formatColorNumber } from '@util/helpers';

export default class Selection {

  constructor(pixels, parent) {

    this.pixels = pixels; // Might have to support multiple pixels in the future

    this.start = this.pixels[0]
    this.end = this.pixels[1] || null;

    this.parent = parent;

    if (this.pixels.length === 1)
      this.pixel = this.pixels[0];

    this.buyoption = 'buy';
  }

  get position() {
    return numberToLetterColumn(this.cy) + this.cx;
  }

  get cx() {
    return this.pixel.tile.cx;
  }

  get cy() {
    return this.pixel.tile.cy;
  }

  get color() {
    return this.pixel.color.color;
  }

  get HEXcolor() {
    return formatColorNumber(this.pixel.color.color.color);
  }

  get title() {
    if (this.pixel)
      return this.position;
    else if (this.start && this.end)
      return `<span class="smaller">
								${numberToLetterColumn(this.start.tile.cy)}${this.start.tile.cx}
								<i class="gg-more-vertical"></i>
								${numberToLetterColumn(this.end.tile.cy)}${this.end.tile.cx}
							</span>`;
  }

  get y() {
    if (this.end && this.end.tile && this.end.tile.y > this.start.tile.y)
      return this.end.tile.y;
    else
      return this.start.tile.y;
  }

  get x() {
    if (this.end && this.end.tile && this.end.tile.x > this.start.tile.x)
      return this.end.tile.x;
    else
      return this.start.tile.x;
  }
}