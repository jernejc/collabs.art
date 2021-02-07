
import Hue from '@components/hue';
import Saturation from '@components/saturation';
import Input from '@components/input';

import { formatColorNumber, fromWei, formatExpireDate } from '@util/helpers';

import Button from './button';

/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ pixel, parent, scene }) {
    if (DEBUG) console.log('Info Box: constructor', pixel);

    this.scene = scene;
    this.parent = parent;
    this.pixel = pixel;
    this.updateTimeout = null;
    this.UIs = ['purchaseUI', 'ownerUI', 'bidUI', 'activeBidUI'];

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
    this.position.innerHTML = this.pixel.position;

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

    await this.pixel.loadGraphData(refresh);

    this.wrapper.removeChild(this.loadingIcon);

    if (!this.pixel.owner)
      this.createPurchaseUI();
    else if (this.scene.game.web3.activeAddress === this.pixel.owner)
      this.createOwnerUI();
    else if (this.pixel.highestBid && this.pixel.highestBid.bidder === this.scene.game.web3.activeAddress)
      this.createActiveBidUI();
    else
      this.createBidUI();

    this.scene.game.emitter.emit('controller/update'); // Update components once everything is in the dom
    this.setPosition();
  }

  setPosition() {
    if (DEBUG) console.log('Info Box: setPosition');

    const padding = 2;
    const vertical = (this.pixel.y > (this.parent.offsetHeight / 2)) ? 'bottom' : 'top';
    const horizontal = (this.pixel.x > (this.parent.offsetWidth / 2)) ? 'right' : 'left';
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown';
    const top = (vertical === 'bottom') ? this.pixel.y - this.wrapper.offsetHeight - padding : this.pixel.y + this.scene.size + padding;
    const left = (horizontal === 'right') ? this.pixel.x - this.wrapper.offsetWidth - padding : this.pixel.x + this.scene.size + padding;

    Object.assign(this.wrapper.style, { top: top + 'px', left: left + 'px' });
    this.wrapper.classList.add(vertical, horizontal);
  }

  createPurchaseUI() {
    if (DEBUG) console.log('Info Box: createPurchaseUI');

    this.purchaseUI = document.createElement('div');
    this.purchaseUI.appendChild(this.createInfoText('Available', 'purchase'));
    this.purchaseUI.appendChild(new Input(this.pixel, 'price', {
      label: 'ETH',
      width: '100%',
      disabled: true,
      border: true,
      scene: this.scene,
      elClasses: ['label-border-input']
    }));

    this.purchaseUI.appendChild(new Button({
      elClasses: ['create', 'action-button'],
      text: 'Create',
      clickAction: async e => {
        try {
          this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

          // Handle Purchase
          const success = await this.pixel.buy();

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

  createOwnerUI() {
    if (DEBUG) console.log('Info Box: createOwnerUI', this.pixel);

    const _self = this; // this is not always this

    let preventClose = null;

    this.ownerUI = document.createElement('div');

    if (this.pixel.highestBid && !this.pixel.highestBid.expired) {
      this.ownerUI.appendChild(this.createInfoText('Pending bid', 'active-bid'));
      this.ownerUI.appendChild(this.createBidsInfo(this.pixel.highestBid));
    } else
      this.ownerUI.appendChild(this.createInfoText('Owned', 'owned'));

    this.ownerUI.appendChild(new Input(this.pixel.color, 'color', {
      label: 'hex',
      width: '100%',
      scene: this.scene,
      type: 'color',
      border: true,
      elClasses: ['label-border-input'],
      format: (value) => '#' + formatColorNumber(value),
      validate: (value) => !isNaN(value) && value.length === 6,
      focus: () => {
        this.colorAdvancedUI.style.display = 'block';
        _self.setPosition();
      },
      blur: (e) => {
        //console.log('e', e);
        if (!preventClose) {
          this.colorAdvancedUI.style.display = 'none';
          _self.setPosition();
        }
      },
      /*onUpdate: () => {
        if (this.updateTimeout !== null)
          this.cancelUpdate();

        this.updateTimeout = setTimeout(async () => {
          await setPixel({ pixel: this.pixel, scene: this.scene })
        }, 1000);
      }*/
    }));

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

    this.colorAdvancedUI.appendChild(new Hue(this.pixel.color, 'h', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.colorAdvancedUI.appendChild(new Saturation(this.pixel.color, 's', {
      min: 0,
      max: 1,
      step: 0.001,
      scene: this.scene
    }));

    this.ownerUI.appendChild(this.colorAdvancedUI);

    this.wrapper.classList.add('ownerUI');
    this.wrapper.appendChild(this.ownerUI);
  }

  createBidUI() {
    if (DEBUG) console.log('Info box: createBidUI');

    this.bidUI = document.createElement('div');
    this.bidUI.appendChild(this.createInfoText('Taken', 'taken'));
    this.bidUI.appendChild(new Input(this.pixel, 'price', {
      min: this.pixel.price,
      max: 100,
      step: 0.001,
      type: 'number',
      label: 'ETH',
      width: '100%',
      scene: this.scene,
      border: true,
      elClasses: ['label-border-input'],
      lang: 'en'
    }));

    this.bidUI.appendChild(new Button({
      elClasses: ['bid', 'action-button'],
      text: 'Place Bid',
      clickAction: async e => {
        try {
          this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

          // Handle Purchase
          const success = await this.pixel.bid();

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
    this.activeBidUI.appendChild(this.createInfoText(this.pixel.highestBid.expired ? 'Bid expired' : 'Bid placed', 'placed'));

    if (this.pixel.highestBid.expired) { // UI for Raising expired bid
      this.activeBidUI.appendChild(new Input(this.pixel, 'price', {
        //min: this.pixel.price,
        max: 100,
        step: 0.001,
        type: 'number',
        label: 'ETH',
        width: '100%',
        border: true,
        elClasses: ['label-border-input'],
        scene: this.scene,
        format: (value) => (value) ? value.toFixed(3) : 0
      }));

      this.activeBidUI.appendChild(new Button({
        elClasses: ['bid', 'action-button'],
        text: 'Raise Bid',
        clickAction: async e => {
          try {
            this.preventRefresh = true; // Address event refreshes UI while buying with new account, it's nasty, but it works.

            // Handle New bid
            const success = await this.pixel.bid();

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
      this.activeBidUI.appendChild(new Input(this.pixel.highestBid, 'amount', {
        label: 'ETH',
        width: '49%',
        disabled: true,
        scene: this.scene,
        border: true,
        elClasses: ['label-border-input'],
        type: 'text',
        format: (value) => value.toFixed(3)
      }));

      this.activeBidUI.appendChild(new Input(this.pixel.highestBid, 'expiresAt', {
        label: 'Expires',
        width: '49%',
        disabled: true,
        scene: this.scene,
        border: true,
        elClasses: ['right', 'label-border-input'],
        type: 'text',
        format: (value) => formatExpireDate(value)
      }));

      this.activeBidUI.appendChild(new Button({
        elClasses: ['cancel', 'action-button'],
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

  createBidsInfo(bid) {
    const bidsinfo = document.createElement('div');
    bidsinfo.classList.add('bids-info');
    bidsinfo.innerHTML = `${bid.amount.toFixed(3)} ETH`;

    return bidsinfo;
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
        this.wrapper.classList.remove(ui);
        this[ui] = null;
      }
    }
  }
}