
import ColorPicker from '@components/color/picker';
import LoadingBar from '@components/loading';

import logger from '@util/logger';
import Button from './form/button';


/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ pixel, parent, game }) {
    logger.log('InfoBox: constructor');

    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.parent = parent;
    this.updateTimeout = null;

    // Pixel relationship
    this.pixel = pixel;
    this.pixel.infobox = this;

    this.setupDom();
  }

  async init() {
    //this.setPosition();

    // Set UI based on pixel / context
    await this.setUI();
  }

  setupDom() {
    logger.log('InfoBox: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('info-box');

    this.position = document.createElement('div');
    this.position.classList.add('position');
    this.position.innerHTML = `${this.pixel.position}`;

    this.domElement.append(this.position);

    this.arrow = document.createElement('i');
    this.arrow.classList.add('arrow');
    this.domElement.append(this.arrow);

    this.closeBtn = document.createElement('i');
    this.closeBtn.classList.add('gg-close-r');
    this.domElement.append(this.closeBtn);

    this.clearSelectionListener = this.destroy.bind(this);
    this.closeBtn.addEventListener('click', this.clearSelectionListener);

    this.loadingIcon = new LoadingBar();

    this.parent.append(this.domElement);
  }

  async setUI(refresh) {
    logger.log('InfoBox: setUI');

    const _self = this;
    const hasUI = this.hasUI();

    if (hasUI) {
      this.resetUI();
    }

    this.domElement.append(this.loadingIcon);
    this.setPosition();

    if (this.pixel.loadingGraph)
      return;

    if (refresh || !this.pixel.graphLoaded)
      await this.pixel.loadGraphData(refresh)

    this.domElement.removeChild(this.loadingIcon);

    // update price
    this.position.innerHTML += `<small>| &nbsp;${this.pixel.bid || 1} $COLAB</small>`;

    this.colorPicker = new ColorPicker(this.pixel, 'color', {
      width: '100%',
      type: 'color',
      scene: this.scene,
      elClasses: ['color-picker'],
      update: (value) => {
        _self.pixel.changeToColorNumber(value);
        _self.pixel.setActivePixel();
        _self.game.tools.updateActiveChangesCount();
        //_self.setActiveChanges();
      }
    });

    this.domElement.append(this.colorPicker.domElement);

    //this.setActiveChanges();
    this.setPosition();
  }

  setActiveChanges() {
    const activeChangesCount = this.game.selection.pixels.filter(pixel => pixel.hasChanges).length;

    if (this.changesInfo) {
      this.applyBtn.destroy();
      this.domElement.removeChild(this.changesWrapper);
    }

    if (activeChangesCount > 0) {
      this.changesWrapper = document.createElement('div');
      this.changesWrapper.classList.add('changes-wrapper');

      this.applyBtn = new Button({
        elClasses:['action-button', 'apply'],
        text: 'Apply'
      });

      this.changesWrapper.append(this.applyBtn.domElement);
    
      this.changesInfo = document.createElement('span');
      this.changesInfo.classList.add('changes-info');
      this.changesInfo.innerHTML = `${activeChangesCount} $COLAB`;

      this.changesWrapper.append(this.changesInfo);

      this.domElement.append(this.changesWrapper);
    }

    this.setPosition();
  }

  setPosition() {
    logger.log('InfoBox: setPosition');

    const padding = 2;
    const vertical = (this.pixel.y > (this.parent.offsetHeight / 2)) ? 'bottom' : 'top';
    const horizontal = (this.pixel.x > (this.parent.offsetWidth / 2)) ? 'right' : 'left';
    const top = (vertical === 'bottom') ? this.pixel.y - this.domElement.offsetHeight - padding : this.pixel.y + this.scene.size + padding;
    const left = (horizontal === 'right') ? this.pixel.x - this.domElement.offsetWidth - padding : this.pixel.x + this.scene.size + padding;

    Object.assign(this.domElement.style, { top: top + 'px', left: left + 'px' });
    this.domElement.classList.add(vertical, horizontal);
  }

  destroy() {
    logger.log('InfoBox: destroy');

    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.clearSelectionListener);
      this.closeBtn = null;
    }

    if (this.pixel) {
      this.pixel.infobox = null;

      if (!this.pixel.hasChanges) {
        this.pixel.removeFromSelection();
        this.game.selection.removeByReference(this.pixel);
      }

      this.pixel = null;
    }

    if (this.colorPicker) {
      this.colorPicker.destroy();
      this.domElement.removeChild(this.colorPicker.domElement);
      this.colorPicker = null;
    }

    if (this.domElement) {
      this.parent.removeChild(this.domElement);
      this.domElement = null;
    }
  }

  hasUI() {
    logger.log('InfoBox: hasUI');

    if (this.colorPicker)
      return true;

    return false;
  }

  resetUI() {
    logger.log('InfoBox: resetUI');

    this.colorPicker.destroy();
    this.domElement.removeChild(this.colorPicker.domElement);
    this.colorPicker = null;

    this.position.innerHTML = `${this.pixel.position}`;
  }
}