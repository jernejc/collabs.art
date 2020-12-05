
import Hue from '@components/hue';
import Saturation from '@components/saturation';
import Input from '@components/input';
import { setPixel, buyPixel } from '@actions/pixel';
import Button from './button';

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

  async init() {
    this.defaultAddress = await this.scene.game.web3.currentDefaultAddress();
    await this.setUI();
  }

  setupTemplate() {
    if (DEBUG) console.log('Info Box: Setup template');

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('info-box');

    this.position = document.createElement('div');
    this.position.classList.add('position');
    this.position.innerHTML = this.selection.title;

    this.wrapper.appendChild(this.position);

    this.arrow = document.createElement('i');
    this.arrow.classList.add('arrow');

    this.wrapper.appendChild(this.arrow);

    this.loadingIcon = document.createElement('i');
    this.loadingIcon.classList.add('gg-loadbar-alt', 'loadingbar');

    this.wrapper.appendChild(this.loadingIcon);

    this.parent.appendChild(this.wrapper);
  }

  async setUI() {
    if (DEBUG) console.log('Info Box: setUI');

    this.owner = await this.scene.game.web3.ownerOf(this.selection.position);
    this.selection.price = await this.scene.game.web3.getDefaultPrice(); // Check for latest bid also

    this.wrapper.removeChild(this.loadingIcon);

    if (this.defaultAddress === this.owner)
      this.createColorUI();
    else
      this.createPurchaseUI();

    this.scene.game.emitter.emit('controller/update'); // Update components once everything is in the dom
    this.setPosition();
  }

  setPosition() {
    if (DEBUG) console.log('Info Box: setPosition')

    const padding = 2;
    const vertical = (this.selection.y > (this.parent.offsetHeight / 2)) ? 'bottom' : 'top'
    const horizontal = (this.selection.x > (this.parent.offsetWidth / 2)) ? 'right' : 'left'
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown'
    const top = (vertical === 'bottom') ? this.selection.y - this.wrapper.offsetHeight - padding : this.selection.y + this.scene.size + padding
    const left = (horizontal === 'right') ? this.selection.x - this.wrapper.offsetWidth - padding : this.selection.x + this.scene.size + padding

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add(vertical, horizontal);
  }

  createPurchaseUI() {
    if (DEBUG) console.log('Info Box: createPurchaseUI');

    this.purchaseUI = document.createElement('div');
    this.purchaseUI.classList.add('ownership');

    this.priceinput = new Input(this.selection, 'price', {
      min: 0,
      max: 1,
      step: 0.001,
      label: 'price',
      width: '100%',
      scene: this.scene,
      format: (value) => value + ' ETH'
    });

    this.purchaseUI.appendChild(this.priceinput);

    this.buy = new Button({
      elClass: 'create', 
      text: 'Create', 
      clickAction: async e => {
        console.log('clickAction');
        
        try {
          await buyPixel({ scene: this.scene, selection: this.selection, color: 'ffffff' });
          this.wrapper.removeChild(this.purchaseUI);
          this.wrapper.appendChild(this.loadingIcon);
          await this.setUI();
        } catch (error) {
          console.error('Buy pixel failed: ' + error);
        }
        
      }
    });

    this.purchaseUI.appendChild(this.buy);
    this.wrapper.appendChild(this.purchaseUI);
  }

  createColorUI() {
    if (DEBUG) console.log('Info Box: createColorUI', this.selection);

    this.colorSelectionUI = document.createElement('div');
    this.colorSelectionUI.classList.add('color-selection');

    // Hex Input
    this.hexInput = new Input(this.selection.pixel, 'color.color.color', {
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
    })
    this.colorSelectionUI.appendChild(this.hexInput);

    // Hue slider
    this.hueInput = new Hue(this.selection.pixel, 'color.color.h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    })
    this.colorSelectionUI.appendChild(this.hueInput);

    // Saturation selector
    this.saturationInput = new Saturation(this.selection.pixel, 'color.color.s', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    });
    this.colorSelectionUI.appendChild(this.saturationInput);

    this.wrapper.appendChild(this.colorSelectionUI);
  }

  destroy() {
    if (DEBUG) console.log('Info box: destroy');

    this.scene.game.emitter.off('controller/update');
    this.parent.removeChild(this.wrapper);
  }

  cancelUpdate() {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }
}