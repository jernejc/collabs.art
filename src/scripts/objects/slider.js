import _ from 'lodash';


/**
 * Slider Class
 */

export default class Slider {

  constructor(object, property, min, max, step, color, scene) {
    //console.log('SLider init', arguments)
    const self = this;

    this.domElement = document.createElement('div');

    this.object = object;
    this.property = property;
    this.min = min;
    this.max = max;
    this.step = step;
    this.color = color;

    this.rangetrack = document.createElement('div');
    this.rangeslider = document.createElement('div');

    this.rangetrack.addEventListener('mousedown', onMouseDown);
    this.rangetrack.addEventListener('touchstart', onTouchStart);

    this.rangetrack.classList.add('slider');
    this.rangeslider.classList.add('slider-fg');
    this.domElement.classList.add('color-wrap');
    this.domElement.classList.add(this.color);

    this.rangetrack.appendChild(this.rangeslider);
    this.domElement.appendChild(this.rangetrack);

    this.updateDisplay();

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

      const bgRect = self.rangetrack.getBoundingClientRect();

      self.setValue(
        map(e.clientX, bgRect.left, bgRect.right, self.min, self.max)
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
        map(clientX, bgRect.left, bgRect.right, self.min, self.max)
      );
    }

    function onTouchEnd() {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    }
  }

  updateDisplay() {
    const pct = (this.getValue() - this.min) / (this.max - this.min);

    this.rangeslider.style.width = pct * 100 + '%';

    if (this.object.tile && this.object.color) {
      this.object.color.color.setTo(this.object.color.color.red, this.object.color.color.green, this.object.color.color.blue)
      this.object.tile.setFillStyle(this.object.color.color.color);
    }

    return;
  }

  getValue() {
    return _.get(this.object, this.property);
  }

  setValue(v) {
    let _v = v;

    if (this.min !== undefined && _v <= this.min) {
      _v = this.min;
    } else if (this.max !== undefined && _v >= this.max) {
      _v = this.max;
    }

    if (this.step !== undefined && _v % this.step !== 0) {
      _v = Math.round(_v / this.step) * this.step;
    }

    _.set(this.object, this.property, _v);

    this.updateDisplay();

    return;
  }
}

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}