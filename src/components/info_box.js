
import ColorPicker from '@components/color_picker';
import Input from '@components/input';
import SelectionRadio from '@components/selection_radio';

import { numberToLetterColumn } from '@util/helpers';

/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ pixels, parent, scene }) {
    //console.log('InfoBox pixels', pixels, parent)
    this.scene = scene;
    this.parent = parent;
    this.setupTemplate(pixels, parent);
    this.setPosition(pixels, parent);
  }

  setPosition(pixels, parent) {
    //console.log('setPosition', pixel, parent.offsetWidth, pixel.tile.x, this.wrapper.offsetWidth, pixel.tile.displayWidth)

    const padding = 2;
    const vertical = (pixel.tile.y > (parent.offsetHeight / 2)) ?  'bottom' : 'top'
    const horizontal = (pixel.tile.x > (parent.offsetWidth / 2)) ?  'right': 'left'
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown'
    const top = (vertical === 'bottom') ? pixel.tile.y - this.wrapper.offsetHeight - padding : pixel.tile.y + pixel.tile.displayHeight + padding
    const left = (horizontal === 'right') ? pixel.tile.x - this.wrapper.offsetWidth - padding : pixel.tile.x + pixel.tile.displayWidth + padding

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add(vertical, horizontal);

    //this.arrow.classList.add(`gg-arrow-${vertical}-${horizontal}-o`)
  }

  setupTemplate(pixels, parent) {
    //console.log('Setup template', pixel, parent);

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('info-box');

    this.position = document.createElement('div');
    this.position.classList.add('position');
    this.position.innerHTML = `${numberToLetterColumn(pixel.tile.cy)}${pixel.tile.cx}`;

    this.wrapper.appendChild(this.position);

    this.arrow = document.createElement('i');
    this.arrow.classList.add('arrow')

    this.wrapper.appendChild(this.arrow);

    //this.setColorSelectionUI(pixel);
    this.setOwnershipUI(pixel);

    try {
      parent.appendChild(this.wrapper);
    } catch (e) {
      return e;
    }
  }

  setOwnershipUI(pixel) {

    this.ownershipUI = document.createElement('div');
    this.ownershipUI.classList.add('ownership');

    this.ownershipUI.appendChild(new SelectionRadio(pixel, 'tile.buyoption', {
      scene: this.scene,
      options: [{
        text: 'Buy',
        value: 'buy',
        name: 'buyoption'
      }, {
        text: 'Rent',
        value: 'rent',
        name: 'buyoption'
      }]
    }));

    // Hex Input
    this.ownershipUI.appendChild(new Input(pixel, 'tile.price', {
      min: 0,
      max: 1,
      step: 0.001,
      label: 'price',
      width: '100%',
      scene: this.scene,
      format: (value) => {
        let _v = value;

        if (pixel.tile.buyoption === 'rent')
          return (_v / 50).toFixed(3) + ' ETH / day'
        else
          return _v + ' ETH'
      }

    }));

    this.bidnow = document.createElement('button');
    this.bidnow.classList.add('bidnow');
    this.bidnow.textContent = 'Bid now!';

    this.ownershipUI.appendChild(this.bidnow);

    this.wrapper.appendChild(this.ownershipUI);
  }

  setColorSelectionUI(pixel) {

    this.colorSelectionUI = document.createElement('div');
    this.colorSelectionUI.classList.add('color-selection');

    // Hex Input
    this.colorSelectionUI.appendChild(new Input(pixel, 'color.color.color', {
      min: 0,
      max: 255,
      step: 2,
      label: 'hex',
      width: '100%',
      scene: this.scene,
      format: (value) => '#' + value.toString(16)
    }))

    // RGB Inputs
    this.colorSelectionUI.appendChild(new Input(pixel, 'color.color.red', {
      min: 0,
      max: 255,
      step: 2,
      label: 'r',
      width: '33%',
      scene: this.scene
    }))
    this.colorSelectionUI.appendChild(new Input(pixel, 'color.color.green', {
      min: 0,
      max: 255,
      step: 2,
      label: 'g',
      width: '33%',
      scene: this.scene
    }))
    this.colorSelectionUI.appendChild(new Input(pixel, 'color.color.blue', {
      min: 0,
      max: 255,
      step: 2,
      label: 'b',
      width: '33%',
      scene: this.scene
    }))

    // Hue slider
    this.colorSelectionUI.appendChild(new ColorPicker(pixel, 'color.color.h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }))

    this.wrapper.appendChild(this.colorSelectionUI);
  }

  destroy() {
    console.log('Info box destroy');
    this.scene.game.emitter.off('controller/update');
    this.parent.removeChild(this.wrapper);
  }
}