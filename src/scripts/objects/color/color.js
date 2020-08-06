
import _ from 'lodash';

export default class Color {

	constructor(object, property, params) {

		this.object = object;
		this.property = property;
		
    this.min = params.min;
    this.max = params.max;
		this.step = params.step;
		this.label = params.label;
		this.width = params.width;
		
		this.domElement = document.createElement('div');

		if (this.width) 
			this.domElement.style.width = this.width;
		
		if (this.label) {
			this.labelElement = document.createElement('label');
			this.labelElement.textContent = this.label;
			this.domElement.appendChild(this.labelElement)
		}
	}

	getValue() {
    return _.get(this.object, this.property);
  }

  setValue(v) {
    let _v = v;

    if (this.min !== undefined && _v <= this.min) 
      _v = this.min;
    else if (this.max !== undefined && _v >= this.max) 
      _v = this.max;

    if (this.step !== undefined && _v % this.step !== 0) 
      _v = Math.round(_v / this.step) * this.step;

    _.set(this.object, this.property, _v);

    this.updateDisplay();

		return;
	}

	updateDisplay() {
    return this;
  }
}