
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

    this.input = document.createElement('input');
    this.input.value = (this.format) ? this.format(this.getValue()) : this.getValue();
    this.input.setAttribute('type', 'text');
    this.domElement.appendChild(this.input);

    this.color = document.createElement('span');
    this.color.classList.add('color');
    this.color.style = `background: #${formatColorNumber(this.getValue())};`
    this.domElement.appendChild(this.color);

    this.input.addEventListener('blur', (e) => {
      if (!preventClose) 
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
    this.colorAdvancedUI.style.display = 'none'; // Hide by default

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

    this.colorAdvancedUI.appendChild(new Hue(this.object[property], 'h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.colorAdvancedUI.appendChild(new Saturation(this.object[property], 's', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.domElement.classList.add('color-picker');
    this.domElement.appendChild(this.colorAdvancedUI);

    return this.domElement;
  }

  getValue() {
    return _.get(this.object[this.property], 'color');
  }

  updateDisplay() {
    let value = this.getValue();

    if (this.format)
      value = this.format(value);

    this.input.value = value;

    if (this.color)
      this.color.style = `background: #${formatColorNumber(this.getValue())};`

    return super.updateDisplay();
  }
}