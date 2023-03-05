
import _ from 'lodash';

import Controller from '@components/controller';

import config from '@util/config';
import { colorToHexString } from '@util/helpers';
import logger from '@util/logger';

/**
 * UI for controlling a Phaser Color Object
 * Uses color, h, s, rgb
 * https://photonstorm.github.io/phaser3-docs/Phaser.Display.Color.html
 */

export default class ColorPicker extends Controller {
  constructor(object, property, params) {
    logger.log('ColorPicker: constructor');

    super(object, property, params);

    if (params.validate)
      this.validate = params.validate;

    this.setupDom();
  }

  setupDom() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('color-picker');

    this.boxesWrapper = document.createElement('div');
    this.boxesWrapper.classList.add('color-wrapper')

    const activeColor = this.getValue();

    config.appConfig.supportedColors.forEach(color => {
      this.boxesWrapper.append(this.createColorBox(color, activeColor))
    })

    this.domElement.append(this.boxesWrapper);

    this.selectColorListener = this.selectColor.bind(this);

    this.boxesWrapper.addEventListener('click', this.selectColorListener);
  }

  setValue(newColorObject, index) {
    logger.log('ColorPicker: setValue')

    const _colorObject = this.object[this.property];
    _colorObject.setFromRGB(newColorObject);

    this.updateDisplay(index);

    if (this.update) // User provided callback
      this.update(this.getValue());
  }

  selectColor(event) {
    logger.log('ColorPicker: selectColor')
    let bgColor = window.getComputedStyle(event.target, null).getPropertyValue('background-color');

    if (!event.target.classList.contains('color-box') || !bgColor)
      return;

    if (this.validate && !this.validate())
      return;

    let colorBoxIndex = this.getColorBoxIndex(event.target)

    this.setValue(Phaser.Display.Color.RGBStringToColor(bgColor), colorBoxIndex);
  }

  getColorBoxIndex(element) {
    return Array.from(element.parentNode.children).indexOf(element)
  }

  updateDisplay(index) {
    logger.log('ColorPicker: updateDisplay')

    const currentActive = this.boxesWrapper.getElementsByClassName('active');

    Array.from(currentActive).forEach(node => {
      node.classList.remove('active');
    })

    Array.from(this.boxesWrapper.children)[index].classList.add('active');
    return super.updateDisplay();
  }

  createColorBox(hex, activeColor) {
    const color = document.createElement('span');
    color.classList.add('color-box');
    color.style = `background: ${hex};`;

    if (colorToHexString(activeColor) === hex) {
      color.classList.add('active');
    }

    return color;
  }

  destroy() {
    logger.log('ColorPicker: destroy');

    if (this.boxesWrapper) {
      this.boxesWrapper.removeEventListener('click', this.selectColorListener);
      this.boxesWrapper = null;
    }

    if (this.parent) {
      this.parent.removeChild(this.domElement);
    }
  }
}