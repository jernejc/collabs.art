
import Controller from '@components/controller';

/**
 * Radio input Class
 */

export default class Radio extends Controller {

  constructor(object, property, params) {

    super(object, property, params);

    const self = this;

    this.radioinput = document.createElement('form');

    if (!Array.isArray(params.options))
      throw new Error('Options need to be an array');

    params.options.forEach(option => {
      const radiobox = document.createElement('input');

      radiobox.type = 'radio';
      radiobox.id = option.value;
      radiobox.value = option.value;
      radiobox.name = property;

      const label = document.createElement('label');
      label.htmlFor = option.value;

      const labelText = document.createTextNode(option.text);
      label.appendChild(labelText);

      this.radioinput.appendChild(radiobox);
      this.radioinput.appendChild(label);
    });

    this.domElement.classList.add('selection-radio');
    this.domElement.appendChild(this.radioinput);

    this.radioinput.addEventListener('change', onChange);

    this.updateDisplay();

    return this.domElement;

    function onChange(e) {
      const attempted = self.radioinput[self.property].value;
      self.setValue(attempted);
    }
  }

  updateDisplay() {
    let value = this.getValue();
    let currentValue = this.radioinput[this.property].value;

    if (value !== currentValue) 
      this.radioinput[this.property].value = value;

    return super.updateDisplay();
  }
}