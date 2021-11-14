
import _ from 'lodash';

/**
 * Used to control a JS object property with UI componets
 */

export default class Controller {

  constructor(object, property, params) {
    if (DEBUG) console.log('Controller: constructor')

    this.object = object;
    this.property = property;

    this.min = params.min;
    this.max = params.max;
    this.step = params.step;
    this.label = params.label;
    this.width = params.width;
    this.scene = params.scene;
    this.format = params.format;
    this.update = params.update;

    this.domElement = document.createElement('div');

    if (this.width)
      this.domElement.style.width = this.width;
    if (params.elClasses)
      this.domElement.classList.add(...params.elClasses);

    if (this.label) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = this.label;
      this.domElement.append(this.labelElement)
    }
  }

  getValue() {
    return _.get(this.object, this.property);
  }

  setValue(v, property) {
    if (DEBUG) console.log('Controller: setValue', property, v);

    let _v = v;
    let _property = property || this.property;

    if (this.min !== undefined && _v <= this.min)
      _v = this.min;
    else if (this.max !== undefined && _v >= this.max)
      _v = this.max;

    if (this.step !== undefined && _v % this.step !== 0)
      _v = Math.round(_v / this.step) * this.step;

    _.set(this.object, _property, _v);

    this.updateDisplay();

    if (this.update) // User provided callback
      this.update(this.getValue());

    return;
  }

  updateDisplay() {
    return this;
  }
}