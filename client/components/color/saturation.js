
import { normalize } from '@util/helpers';

import Controller from '@components/controller';

/**
 * Saturation Class
 * Accepts only objects of Phaser.Display.Color: https://photonstorm.github.io/phaser3-docs/Phaser.Display.Color.html
 */

export default class Saturation extends Controller {

  constructor(object, property, params) {
    if (DEBUG) console.log('Saturation: constructor')

    super(object, property, params);

    const self = this;

    this.palette = document.createElement('div');
    this.paletteshape = document.createElement('div');

    this.palette.addEventListener('mousedown', onMouseDown);
    this.paletteshape.addEventListener('touchstart', onTouchStart);

    this.palette.classList.add('palette');
    this.paletteshape.classList.add('paletteshape');

    this.domElement.classList.add('saturation');

    this.palette.append(this.paletteshape);
    this.domElement.append(this.palette);

    return this.domElement;

    // Helpers

    function onMouseDown(e) {
      document.activeElement.blur();

      window.addEventListener('mousemove', onMouseDrag);
      window.addEventListener('mouseup', onMouseUp);

      onMouseDrag(e);
    }

    function onMouseDrag(e) {
      e.preventDefault();

      const bgRect = self.palette.getBoundingClientRect();

      let X = e.clientX;
      let Y = e.clientY;

      if (X < bgRect.left)
        X = bgRect.left;
      else if (X > bgRect.left + bgRect.width)
        X = bgRect.left + bgRect.width;

      if (Y < bgRect.top)
        Y = bgRect.top;
      else if (Y > bgRect.top + bgRect.height)
        Y = bgRect.top + bgRect.height;

      X -= bgRect.left;
      Y -= bgRect.top;

      self.setValue(1 - (Y / bgRect.height), 'v', true); // Reverse the Y value
      self.setValue(X / bgRect.width);

      return false;
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseDrag);
      window.removeEventListener('mouseup', onMouseUp);
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) { return; }

      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);

      onTouchMove(e);
    }

    function onTouchMove(e) {
      const clientX = e.touches[0].clientX;
      const bgRect = self.palette.getBoundingClientRect();

      self.setValue(
        normalize(clientX, bgRect.left, bgRect.right, self.min, self.max)
      );
    }

    function onTouchEnd() {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    }
  }

  updateDisplay() {
    if (DEBUG) console.log('Saturation: updateDisplay', this.object);

    const Xpos = parseInt(this.getValue() * 100);
    const Ypos = parseInt((1 - this.object.v) * 100); // Reverse the Y value again for proper shape calc

    this.paletteshape.style.left = `calc(${Xpos}% - ${this.paletteshape.offsetWidth / 2}px)`;
    this.paletteshape.style.top = `calc(${Ypos}% - ${this.paletteshape.offsetHeight / 2}px)`;

    this.paletteshape.style.background = this.object.rgba;

    this.palette.style.background = `
      linear-gradient(to top, rgba(0, 0, 0, 1), transparent),
      linear-gradient(to left, hsla(${parseInt(this.object.h * 360)}, 100%, 50%, 1), rgba(255, 255, 255, 1))
    `;

    return super.updateDisplay();
  }
}