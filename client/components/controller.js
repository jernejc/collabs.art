
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
    this.onUpdate = params.onUpdate;

    this.domElement = document.createElement('div');

    if (this.width)
      this.domElement.style.width = this.width;
    if (params.elClasses)
      this.domElement.classList.add(...params.elClasses);

    if (this.label) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = this.label;
      this.domElement.appendChild(this.labelElement)
    }

    if (this.scene) {
      this.scene.game.emitter.on('controller/update', property => {
        if (DEBUG) console.log('controller/update', this.property, property); 

        if (this.property !== property) // Update UI if emit not comming from the same property -- Components stay in sync
          this.updateDisplay();
        
        if (property) { // Not Init
          if (this.onUpdate) // User provided callback
            this.onUpdate();
        }
      });
    }
  }

  getValue() {
    return _.get(this.object, this.property);
  }

  setValue(v, property) {
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

    if (this.scene)
      this.scene.game.emitter.emit('controller/update', _property);

    return;
  }

  updateDisplay() {
    return this;
  }
}