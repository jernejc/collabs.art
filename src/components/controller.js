
import _ from 'lodash';

export default class Controller {

	constructor(object, property, params) {

		this.object = object;
		this.property = property;

		this.min = params.min;
		this.max = params.max;
		this.step = params.step;
		this.label = params.label;
		this.width = params.width;
		this.scene = params.scene;
		this.format = params.format;

		this.domElement = document.createElement('div');
		this.domElement.classList.add('controller');
		this.domElement.classList.add(this.property.replace(/[^a-zA-Z]/g, ""));

		if (this.width)
			this.domElement.style.width = this.width;

		if (this.label) {
			this.labelElement = document.createElement('label');
			this.labelElement.textContent = this.label;
			this.domElement.appendChild(this.labelElement)
		}

		if (this.scene) {
			this.scene.game.emitter.on('controller/update', property => {
				//console.log('controller/update', this.property, property);

				if (this.property !== property)
					this.updateDisplay();
      });
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

		if (this.scene)
			this.scene.game.emitter.emit('controller/update', this.property);

		return;
	}

	updateDisplay() {
		return this;
	}
}