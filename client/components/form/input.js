
import Controller from '@components/controller';

/**
 * Input Class
 */

export default class Input extends Controller {

  constructor(object, property, params) {
    if (DEBUG) console.log('Input: constructor', object, property, params);

    super(object, property, params);

    const self = this;

    this.input = document.createElement('input');
    this.input.value = (this.format) ? this.format(this.getValue()) : this.getValue();
    this.input.setAttribute('type', params.type || 'text');

    this.domElement.append(this.input);

    if (params.border) {
      this.border = document.createElement('div');
      this.border.classList.add('input-border');
      this.domElement.append(this.border);
    }

    if (params.step)
      this.input.setAttribute('step', params.step);
    if (params.max) {
      if (params.type === 'text')
        this.input.setAttribute('maxlength', params.max);
      else
        this.input.setAttribute('max', params.max);
    } if (params.min)
      this.input.setAttribute('min', params.min);
    if (params.placeholder)
      this.input.setAttribute('placeholder', params.placeholder)
    if (params.lang)
      this.input.setAttribute('lang', params.lang);

    if (params.disabled)
      this.input.disabled = true;
    if (params.blur)
      this.input.addEventListener('blur', params.blur)
    if (params.focus)
      this.input.addEventListener('focus', params.focus);

    this.input.addEventListener('change', onChange);
    this.input.addEventListener('keydown', async e => {
      onChange();

      if (params.onChange)
        await params.onChange()
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