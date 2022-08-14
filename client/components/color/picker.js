
import _ from 'lodash';

import Controller from '@components/controller';

import config from '@util/config';

/**
 * UI for controlling a Phaser Color Object
 * Uses color, h, s, rgb
 * https://photonstorm.github.io/phaser3-docs/Phaser.Display.Color.html
 */

export default class ColorPicker extends Controller {
  constructor(object, property, params) {
    if (DEBUG) console.log('ColorPicker: constructor', object, property, params);

    super(object, property, params);

    this.setupDom()
  }

  setupDom() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('color-picker');

    this.boxesWrapper = document.createElement('div');
    this.boxesWrapper.classList.add('color-wrapper')

    config.appConfig.supportedColors.forEach(color => {
      this.boxesWrapper.append(this.createColorBox(color))
    })

    this.domElement.append(this.boxesWrapper);
  }

  getValue() {
    return _.get(this.object[this.property], 'color');
  }

  updateDisplay(component) {
    if (DEBUG) console.log('ColorPicker: updateDisplay', this.object[this.property])

    let value = this.getValue();

    if (this.update)
      this.update(value);

    return super.updateDisplay();
  }

  createColorBox(hex) {
    const color = document.createElement('span');
    color.classList.add('color-box')
    color.style = `background: ${hex};`

    return color;
  }
}