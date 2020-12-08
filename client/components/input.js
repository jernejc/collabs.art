
import Controller from '@components/controller';

/**
 * Input Class
 */

export default class Input extends Controller {

  constructor(object, property, params) {

    super(object, property, params);

    const self = this;

    this.input = document.createElement('input');

    if (params.type)
      this.input.setAttribute('type', params.type);
    else
      this.input.setAttribute('type', 'text');

    this.border = document.createElement('div');
    this.border.classList.add('input-border');

    this.domElement.appendChild(this.input);
    this.domElement.appendChild(this.border);
    this.domElement.classList.add('text-input');

    this.input.addEventListener('change', onChange);
    this.input.addEventListener('keydown', e => {
      onChange();
    });

    return this.domElement;

    // Helpers

    function onChange() {
      /*if (DEBUG)*/ console.log('onChange', self.input.value)

      const format = self.input.value.replace('#', '')

      if (!isNaN(format) && format.length === 6)
        self.setValue(format);
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