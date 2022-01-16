
import _ from 'lodash';

import Controller from '@components/controller';

import Hue from '@components/color/hue';
import Saturation from '@components/color/saturation';

import { formatColorNumber } from '@util/helpers';

/**
 * UI for controlling a Phaser Color Object
 * Uses color, h, s, rgb
 * https://photonstorm.github.io/phaser3-docs/Phaser.Display.Color.html
 */

export default class ColorPicker extends Controller {
  constructor(object, property, params) {
    if (DEBUG) console.log('ColorPicker: constructor', object, property, params);

    super(object, property, params);

    let preventClose = false;

    this.color = document.createElement('span');
    this.color.classList.add('color');
    this.color.style = `background: #${formatColorNumber(this.getValue())};`

    this.domElement.append(this.color);

    this.input = document.createElement('input');
    this.input.value = (this.format) ? this.format(this.getValue()) : this.getValue();
    this.input.setAttribute('type', 'text');

    this.domElement.append(this.input);

    this.input.addEventListener('blur', (e) => {
      if (!preventClose && !params.visible)
        this.colorAdvancedUI.style.display = 'none';

      if (params.blur)
        params.blur();
    })

    this.input.addEventListener('focus', (e) => {
      this.colorAdvancedUI.style.display = 'block';

      if (params.focus)
        params.focus();
    });

    this.colorAdvancedUI = document.createElement('div');
    this.colorAdvancedUI.classList.add('advanced-color');

    if (params.visible)
      this.colorAdvancedUI.style.display = 'block';
    else
      this.colorAdvancedUI.style.display = 'none';

    this.colorAdvancedUI.addEventListener('mouseenter', (e) => {
      //console.log('mouse enter');
      if (!preventClose)
        preventClose = true
    });

    this.colorAdvancedUI.addEventListener('mouseleave', (e) => {
      //console.log('mouse leave');
      if (preventClose)
        preventClose = false
    });

    this.hueController = new Hue(this.object[property], 'h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene,
      update: () => this.updateDisplay('hue')
    });
    this.colorAdvancedUI.append(this.hueController.domElement);

    this.saturationController = new Saturation(this.object[property], 's', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene,
      update: () => this.updateDisplay('saturation')
    });
    this.colorAdvancedUI.append(this.saturationController.domElement);

    this.domElement.classList.add('color-picker');
    this.domElement.append(this.colorAdvancedUI);
  }

  getValue() {
    return _.get(this.object[this.property], 'color');
  }

  updateDisplay(component) {
    if (DEBUG) console.log('ColorPicker: updateDisplay', this.object[this.property])

    let formatted, value = this.getValue();

    // Color picker is just a wrapper, so setValue is not used, need to trigger hooks here
    if (this.format)
      formatted = this.format(value);
    if (this.update)
      this.update(value);

    if (component === 'hue' && this.saturationController)
      this.saturationController.updateDisplay();

    this.input.value = formatted;

    if (this.color)
      this.color.style = `background: #${formatColorNumber(value)};`

    return super.updateDisplay();
  }
}