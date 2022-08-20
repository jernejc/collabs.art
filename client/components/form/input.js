
import logger from '@util/logger';

import Controller from '@components/controller';

/**
 * Input Class
 */

export default class Input extends Controller {

  constructor(object, property, params) {
    logger.log('Input: constructor');

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

    if (params.step) {
      this.originalStep = params.step;
      this.input.setAttribute('step', params.step);
    }
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

    if (params.decimals) {
      this.originalDecimals = params.decimals;
      this.decimals = params.decimals;
    }
    if (params.disabled)
      this.input.disabled = true;
    if (params.blur)
      this.input.addEventListener('blur', params.blur)
    if (params.focus)
      this.input.addEventListener('focus', params.focus);
    if (params.dynamicWidth)
      this.dynamicWidth = true;
    if (params.onChange)
      this.onChange = params.onChange;

    this.input.addEventListener('change', onChange);
    this.input.addEventListener('keydown', onKeyDown);

    if (this.label) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = this.label;
      this.domElement.append(this.labelElement);
    }

    async function onChange() {
      logger.log('Input: onChange', self.input.value);

      if (self.decimals && self.input.value >= 100) {
        self.decimals = 0;
        self.input.setAttribute('step', 1);
      } else if (!self.decimals && self.input.value < 100) {
        self.decimals = self.originalDecimals;
        self.step = self.originalStep;
        self.input.setAttribute('step', self.step);
      }

      let valid = true;

      if (self.validate)
        valid = self.validate(self.input.value);

      if (valid)
        self.setValue(self.input.value);

      if (self.onChange)
        await self.onChange(self.getValue());

      self.setNewInputWith();
    }

    function onKeyDown() {
      logger.log('Input: onKeyDown', self.input.value.toString().length);

      self.setNewInputWith();
    }

    self.setNewInputWith();
  }

  setNewInputWith() {
    logger.log('Input: setNewInputWith', this.input.value.length);

    if (!this.dynamicWidth)
      return;

    let newWidth;

    if (this.input.value >= 100)
      newWidth = this.input.value.toString().length + 0.6; 
    else
      newWidth = this.input.value.toString().length;

    newWidth = parseFloat(newWidth * 0.75).toFixed(1);

    if (newWidth < 2.5)
      newWidth = 2.5;
    else if (newWidth > 3.7)
      newWidth = 3.7;

    this.input.style.width = `${newWidth}em`;
  }

  updateDisplay() {
    let value = this.getValue();

    if (this.format)
      value = this.format(value);
    else if (this.decimals > 0)
      value = parseFloat(value).toFixed(this.decimals);

    this.input.value = value;

    return super.updateDisplay();
  }

  destroy() {
    logger.log('Input: destroy');
  }
}