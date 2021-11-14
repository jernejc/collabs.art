
import { normalize } from '@util/helpers';

import Controller from '@components/controller';

/**
 * Hue Class
 */

export default class Hue extends Controller {

  constructor(object, property, params) {
    if (DEBUG) console.log('Hue: constructor')

    super(object, property, params);

    const self = this;

    this.rangetrack = document.createElement('div');
    this.rangepointer = document.createElement('div');
    this.rangeshape = document.createElement('div');

    this.rangetrack.addEventListener('mousedown', onMouseDown);
    this.rangetrack.addEventListener('touchstart', onTouchStart);

    this.rangetrack.classList.add('track');
    this.rangepointer.classList.add('pointer');
    this.rangeshape.classList.add('shape');

    this.domElement.classList.add('hue');

    this.rangepointer.append(this.rangeshape);
    this.rangetrack.append(this.rangepointer);

    this.domElement.append(this.rangetrack);

    this.updateDisplay();

    // Helpers

    function onMouseDown(e) {
      document.activeElement.blur();

      window.addEventListener('mousemove', onMouseDrag);
      window.addEventListener('mouseup', onMouseUp);

      onMouseDrag(e);
    }

    function onMouseDrag(e) {
      e.preventDefault();

      const bgRect = self.rangetrack.getBoundingClientRect();

      self.setValue(
        normalize(e.clientX, bgRect.left, bgRect.right, self.min, self.max)
      );

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
      const bgRect = self.rangetrack.getBoundingClientRect();

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
    if (DEBUG) console.log('Hue: updateDisplay', this.object);

    const pct = (this.getValue() - this.min) / (this.max - this.min);

    this.rangepointer.style.left = pct * 100 + '%';

    return super.updateDisplay();
  }
}