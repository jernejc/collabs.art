
import Input from '@components/form/input';
import Button from '@components/form/button';
import ColorPicker from '@components/color/picker';
import LoadingBar from '@components/loading';

import { formatColorNumber, formatExpireDate } from '@util/helpers';

/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ pixel, parent, game }) {
    if (DEBUG) console.log('Info Box: constructor', pixel);

    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.parent = parent;
    this.updateTimeout = null;
    this.UIs = ['purchaseUI', 'ownerUI', 'bidUI', 'activeBidUI'];

    // Pixel relationship
    this.pixel = pixel;
    this.pixel.infobox = this;

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

    this.loadingIcon = new LoadingBar();

    this.parent.appendChild(this.wrapper);
  }

  async setUI(refresh) {
    if (DEBUG) console.log('Info Box: setUI');

    if (this.hasUI())
      this.resetUI();

    this.wrapper.appendChild(this.loadingIcon);
    this.setPosition();

    if (this.pixel.loadingGraph)
      return;

    if (refresh || !this.pixel.graphLoaded)
      await this.pixel.loadGraphData(refresh);

    this.wrapper.removeChild(this.loadingIcon);

    if (!this.pixel.owner)
      this.createPurchaseUI();
    else if (this.game.web3.activeAddress === this.pixel.owner)
      this.createOwnerUI();
    else if (this.pixel.highestBid && this.pixel.highestBid.bidder === this.game.web3.activeAddress)
      this.createActiveBidUI();
    else
      this.createBidUI();

    this.game.emitter.emit('controller/update'); // Update components once everything is in the dom
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
      label: this.game.web3.currentSymbol,
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

    this.ownerUI = document.createElement('div');

    if (this.pixel.highestBid && !this.pixel.highestBid.expired) {
      this.ownerUI.appendChild(this.createInfoText('Pending bid', 'active-bid'));
      this.ownerUI.appendChild(this.createBidsInfo(this.pixel.highestBid));
    } else
      this.ownerUI.appendChild(this.createInfoText('Owned', 'owned'));

    this.ownerUI.appendChild(new ColorPicker(this.pixel, 'color', {
      //label: 'hex',
      width: '100%',
      scene: this.scene,
      elClasses: ['color-picker'],
      format: (value) => '#' + formatColorNumber(value),
      validate: (value) => !isNaN(value) && value.length === 6,
      focus: () => {
        _self.setPosition();
      },
      blur: () => {
        //console.log('e', e)
        _self.setPosition();
      },
      update: (value) => { console.log('ColorPicker update', value); _self.pixel.changeToColorNumber(value) }
    }));

    /*this.ownerUI.appendChild(new Button({
      elClasses: ['apply', 'action-button'],
      text: 'Apply',
      clickAction: async e => {
        await colorPixels({ scene: this.scene, selection: this.game.selection.pixels })
      }
    }));*/

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
      label: this.game.web3.currentSymbol,
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
        label: this.game.web3.currentSymbol,
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
        label: this.game.web3.currentSymbol,
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

    this.game.emitter.off('controller/update');
    this.parent.removeChild(this.wrapper);
    this.pixel.infobox = null;
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