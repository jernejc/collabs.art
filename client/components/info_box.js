
import Hue from '@components/hue';
import Saturation from '@components/saturation';
import Input from '@components/input';

import { setPixel, buyPixel, bidPixel } from '@actions/pixel';

import { formatColorNumber, fromWei, formatExpireDate } from '@util/helpers';

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
    this.UIs = ['purchaseUI', 'colorSelectionUI', 'bidUI', 'activeBidUI'];

    this.setupTemplate();
  }

  async init() {
    this.setPosition();

    // Set UI based on pixel / context
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

    this.loadingIcon = document.createElement('div');
    this.loadingIcon.classList.add('loadingbar');
    this.loadingIcon.innerHTML = `<i class="gg-loadbar-alt"></i><br /> Loading..`;

    this.parent.appendChild(this.wrapper);
  }

  async setUI(refresh) {
    if (DEBUG) console.log('Info Box: setUI');

    if (this.hasUI())
      this.resetUI();

    this.wrapper.appendChild(this.loadingIcon);
    this.setPosition();

    this.highestBid = null;

    const pixelData = await this.scene.game.graph.loadPixel({
      id: this.selection.position
    }, refresh);

    if (pixelData) {
      this.owner = pixelData.owner.toLowerCase();

      if (pixelData.highestBid && pixelData.highestBid.amount) { // Check for latest bid also
        this.highestBid = pixelData.highestBid;
        this.highestBid.amount = parseFloat(fromWei(this.highestBid.amount)) // Conver from Wei
        this.highestBid.expired = (new Date(this.highestBid.expiresAt * 1000) - new Date() < 0);
        this.selection.price = this.highestBid.amount + 0.001;
      }
    }

    if (!this.selection.price)
      this.selection.price = await this.scene.game.web3.getDefaultPrice();

    this.wrapper.removeChild(this.loadingIcon);

    if (!this.owner)
      this.createPurchaseUI();
    else if (this.scene.game.web3.activeAddress === this.owner)
      this.createColorUI();
    else if (this.highestBid && this.highestBid.bidder === this.scene.game.web3.activeAddress)
      this.createActiveBidUI();
    else
      this.createBidUI();

    this.scene.game.emitter.emit('controller/update'); // Update components once everything is in the dom
    this.setPosition();
  }

  setPosition() {
    if (DEBUG) console.log('Info Box: setPosition')

    const padding = 2;
    const vertical = (this.selection.y > (this.parent.offsetHeight / 2)) ? 'bottom' : 'top';
    const horizontal = (this.selection.x > (this.parent.offsetWidth / 2)) ? 'right' : 'left';
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown';
    const top = (vertical === 'bottom') ? this.selection.y - this.wrapper.offsetHeight - padding : this.selection.y + this.scene.size + padding;
    const left = (horizontal === 'right') ? this.selection.x - this.wrapper.offsetWidth - padding : this.selection.x + this.scene.size + padding;

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add(vertical, horizontal);
  }

  createPurchaseUI() {
    if (DEBUG) console.log('Info Box: createPurchaseUI');

    this.purchaseUI = document.createElement('div');
    this.purchaseUI.appendChild(this.createInfoText('Available', 'purchase'));
    this.purchaseUI.appendChild(new Input(this.selection, 'price', {
      label: 'ETH',
      width: '100%',
      disabled: true,
      scene: this.scene
    }));

    this.purchaseUI.appendChild(new Button({
      elClass: 'create',
      text: 'Create',
      clickAction: async e => {
        try {
          this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

          // Handle Purchase
          const success = await buyPixel({ scene: this.scene, selection: this.selection });

          this.preventRefresh = false;

          // Refresh UI
          if (success) {
            await this.setUI(true);
          }
        } catch (error) {
          console.error('Failed to buy pixel', error);
        }
      }
    }));

    this.wrapper.classList.add('purchaseUI');
    this.wrapper.appendChild(this.purchaseUI);
  }

  createColorUI() {
    if (DEBUG) console.log('Info Box: createColorUI', this.selection);

    this.colorSelectionUI = document.createElement('div');
    this.colorSelectionUI.appendChild(this.createInfoText('Owned', 'owned'));
    this.colorSelectionUI.appendChild(new Input(this.selection.pixel, 'color.color.color', {
      label: 'hex',
      width: '100%',
      scene: this.scene,
      type: 'color',
      focus: () => { console.log('focus'); this.colorAdvancedUI.style.display = 'block' },
      blur: () => { console.log('blur'); this.colorAdvancedUI.style.display = 'none' },
      format: (value) => '#' + formatColorNumber(value),
      validate: (value) => !isNaN(value) && value.length === 6,
      onUpdate: () => {
        if (this.updateTimeout !== null)
          this.cancelUpdate();

        this.updateTimeout = setTimeout(async () => {
          await setPixel({ selection: this.selection, scene: this.scene })
        }, 1000);
      }
    }));

    this.colorAdvancedUI = document.createElement('div');
    this.colorAdvancedUI.style.display = 'none';

    this.colorAdvancedUI.appendChild(new Hue(this.selection.pixel, 'color.color.h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.colorAdvancedUI.appendChild(new Saturation(this.selection.pixel, 'color.color.s', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.colorSelectionUI.appendChild(this.colorAdvancedUI);

    this.wrapper.classList.add('colorSelectionUI');
    this.wrapper.appendChild(this.colorSelectionUI);
  }

  createBidUI() {
    if (DEBUG) console.log('Info box: createBidUI');

    this.bidUI = document.createElement('div');
    this.bidUI.appendChild(this.createInfoText('Taken', 'taken'));
    this.bidUI.appendChild(new Input(this.selection, 'price', {
      min: this.selection.price,
      max: 100,
      step: 0.001,
      type: 'number',
      label: 'ETH',
      width: '100%',
      scene: this.scene
    }));

    this.bidUI.appendChild(new Button({
      elClass: 'bid',
      text: 'Place Bid',
      clickAction: async e => {
        try {
          this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

          // Handle Purchase
          const success = await bidPixel({ scene: this.scene, selection: this.selection });

          this.preventRefresh = false;

          // Refresh UI
          if (success) {
            await this.setUI(true);
          }
        } catch (error) {
          console.error('Failed to buy pixel', error);
        }
      }
    }));

    this.wrapper.classList.add('bidUI');
    this.wrapper.appendChild(this.bidUI);
  }

  createActiveBidUI() {
    if (DEBUG) console.log('Info box: activeBidUI');

    this.activeBidUI = document.createElement('div');
    this.activeBidUI.appendChild(this.createInfoText(this.highestBid.expired ? 'Bid expired' : 'Bid placed', 'placed'));

    if (this.highestBid.expired) { // UI for Raising expired bid
      this.activeBidUI.appendChild(new Input(this.selection, 'price', {
        min: this.selection.price,
        max: 100,
        step: 0.001,
        type: 'number',
        label: 'ETH',
        width: '100%',
        scene: this.scene
      }));

      this.activeBidUI.appendChild(new Button({
        elClass: 'bid',
        text: 'Raise Bid',
        clickAction: async e => {
          try {
            this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

            // Handle New bid
            const success = await bidPixel({ scene: this.scene, selection: this.selection });

            this.preventRefresh = false;

            // Refresh UI
            if (success) {
              await this.setUI(true);
            }
          } catch (error) {
            console.error('Failed to buy pixel', error);
          }
        }
      }))
    } else { // Display existing bid
      this.activeBidUI.appendChild(new Input(this.highestBid, 'amount', {
        label: 'ETH',
        width: '49%',
        disabled: true,
        scene: this.scene,
        type: 'text'
      }));

      this.activeBidUI.appendChild(new Input(this.highestBid, 'expiresAt', {
        label: 'Expires',
        width: '49%',
        disabled: true,
        scene: this.scene,
        className: 'right',
        type: 'text',
        format: (value) => formatExpireDate(value)
      }));

      this.activeBidUI.appendChild(new Button({
        elClass: 'cancel',
        text: 'Cancel Bid',
        clickAction: async e => {
          try {
            this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

            // Refresh UI
            //if (success) {
            await this.setUI(true);
            //}
          } catch (error) {
            console.error('Failed to buy pixel', error);
          }
        }
      }));
    }


    this.wrapper.classList.add('activeBidUI');
    this.wrapper.appendChild(this.activeBidUI);
  }

  createInfoText(text, className) {
    const infotext = document.createElement('div');
    infotext.classList.add('text-info', className);
    infotext.innerHTML = '&nbsp; ' + text + ' <i class="gg-info"></i>';

    return infotext;
  }

  destroy() {
    if (DEBUG) console.log('Info box: destroy');

    this.scene.game.emitter.off('controller/update');
    this.parent.removeChild(this.wrapper);
  }

  hasUI() {
    if (DEBUG) console.log('Info box: hasUI');

    for (let ui of this.UIs)
      if (this[ui])
        return true;

    return false;
  }

  resetUI() {
    if (DEBUG) console.log('Info box: resetUI');

    for (let ui of this.UIs) {
      if (this[ui]) {
        this.wrapper.removeChild(this[ui]);
        this[ui] = null;
      }
    }
  }

  cancelUpdate() {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }
}