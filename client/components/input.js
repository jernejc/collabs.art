
import Controller from '@components/controller';
import { formatColorNumber } from '@util/helpers';

/**
 * Input Class
 */

export default class Input extends Controller {

  constructor(object, property, params) {

    super(object, property, params);

    const self = this;

    this.input = document.createElement('input');
    this.domElement.appendChild(this.input);

    switch (params.type) {
      case 'color':
          this.color = document.createElement('span');
          this.color.classList.add('color');
          this.color.style = `background: #${formatColorNumber(this.getValue())};`
          this.domElement.appendChild(this.color);
          this.input.setAttribute('type', 'text');
        break;
      default:
        this.input.setAttribute('type', params.type);
    }

    this.border = document.createElement('div');
    this.border.classList.add('input-border');

    this.domElement.appendChild(this.border);
    this.domElement.classList.add('text-input');

    if (params.className)
      this.domElement.classList.add(params.className);
    if (params.step)
      this.input.setAttribute('step', params.step);
    if (params.max)
      this.input.setAttribute('max', params.max);
    if (params.min)
      this.input.setAttribute('min', params.min);
    if (params.disabled) 
      this.input.disabled = true;
    if (params.blur)
      this.input.addEventListener('blur', params.blur)
    if (params.focus)
      this.input.addEventListener('focus', params.focus);

    this.input.addEventListener('change', onChange);
    this.input.addEventListener('keydown', e => {
      onChange();
    });

    return this.domElement;

    // Helpers

    function onChange() {
      if (DEBUG) console.log('onChange', self.input.value);

      //const format = self.input.value.replace('#', '');
      let valid = true;

      if (self.validate)
        valid = self.validate(self.input.value);

      if (valid)
        self.setValue(self.input.value);
    }
  }

  updateDisplay() {
    let value = this.getValue();

    if (this.format)
      value = this.format(value);

    this.input.value = value;

    return super.updateDisplay();
  }
}