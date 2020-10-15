
import { numberToLetterColumn } from '@util/helpers';

export default class Selection { 

	constructor(pixels, parent) {

		this.pixels = pixels;
		
		this.start = this.pixels[0]
		this.end = this.pixels[1] || null;

		this.parent = parent;
		this.color = new Phaser.Display.Color();
		
		if (this.pixels.length === 1)
			this.pixel = this.pixels[0];

		this.price = Math.random().toFixed(3);
		this.buyoption = 'buy';
	}

	get title() {
		if (this.pixel)
			return `${numberToLetterColumn(this.pixel.tile.cy)}${this.pixel.tile.cx}`;
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