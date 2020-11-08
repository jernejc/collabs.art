
import Hue from '@components/hue';
import Saturation from '@components/saturation';
import Input from '@components/input';
import { setPixel } from '@actions/pixel'

/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ selection, parent, scene }) {
    if (DEBUG) console.log('Info Box: constructor');

    this.scene = scene;
    this.parent = parent;
    this.selection = selection;
    this.updateTimeout = null;

    this.setupTemplate();
    this.setPosition();
  }

  setupTemplate() {
    if (DEBUG) console.log('Info Box:  Setup template');

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('info-box');

    this.position = document.createElement('div');
    this.position.classList.add('position');
    this.position.innerHTML = this.selection.title;

    this.wrapper.appendChild(this.position);

    this.arrow = document.createElement('i');
    this.arrow.classList.add('arrow');

    this.wrapper.appendChild(this.arrow);

    this.setOwnershipUI();

    try {
      this.parent.appendChild(this.wrapper);
      
      this.scene.game.emitter.emit('controller/update'); // Update components once everything is in the dom
    } catch (e) {
      return e;
    }
  }

  setPosition() {
    if (DEBUG) console.log('Info Box: setPosition')

    const padding = 2;
    const vertical = (this.selection.y > (this.parent.offsetHeight / 2)) ?  'bottom' : 'top'
    const horizontal = (this.selection.x > (this.parent.offsetWidth / 2)) ?  'right': 'left'
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown'
    const top = (vertical === 'bottom') ? this.selection.y - this.wrapper.offsetHeight - padding : this.selection.y + this.scene.size + padding
    const left = (horizontal === 'right') ? this.selection.x - this.wrapper.offsetWidth - padding : this.selection.x + this.scene.size + padding

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add(vertical, horizontal);

  }

  setOwnershipUI() {
    if (DEBUG) console.log('Info Box: setOwnershipUI', this.selection);

    this.ownershipUI = document.createElement('div');
    this.ownershipUI.classList.add('ownership');

    this.ownershipUI.appendChild(new Input(this.selection.pixel, 'tile.price', {
      min: 0,
      max: 1,
      step: 0.001,
      label: 'price',
      width: '100%',
      scene: this.scene,
      format: (value) => {
        let _v = value;

        if (this.selection.buyoption === 'rent')
          return (_v / 50).toFixed(3) + ' ETH / day'
        else
          return _v + ' ETH'
      }

    }));

    /*this.bidnow = document.createElement('button');
    this.bidnow.classList.add('bidnow');
    this.bidnow.textContent = 'Bid now!';

    this.ownershipUI.appendChild(this.bidnow);*/

    this.wrapper.appendChild(this.ownershipUI);

    this.colorSelectionUI = document.createElement('div');
    this.colorSelectionUI.classList.add('color-selection');

    // Hex Input
    this.colorSelectionUI.appendChild(new Input(this.selection.pixel, 'color.color.color', {
      min: 0,
      max: 255,
      step: 2,
      label: 'hex',
      width: '100%',
      scene: this.scene,
      format: (value) => '#' + value.toString(16),
      onUpdate: () => {
        if (this.updateTimeout !== null)
          this.cancelUpdate();

        this.updateTimeout = setTimeout(() => {
          setPixel({ pixel: this.selection.pixel, scene: this.scene })
        }, 500);
      }
    }))

    // Hue slider
    this.colorSelectionUI.appendChild(new Hue(this.selection.pixel, 'color.color.h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }))

    // Saturation selector
    this.colorSelectionUI.appendChild(new Saturation(this.selection.pixel, 'color.color.s', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }))

    this.wrapper.appendChild(this.colorSelectionUI);
  }

  destroy() {
    if (DEBUG) console.log('Info box destroy');

    this.scene.game.emitter.off('controller/update');
    this.parent.removeChild(this.wrapper);
  }

  cancelUpdate() {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }
}