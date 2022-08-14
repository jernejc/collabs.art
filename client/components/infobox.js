
import ColorPicker from '@components/color/picker';
import LoadingBar from '@components/loading';


/**
 * InfoBox Class
 */

export default class InfoBox {

  constructor({ pixel, parent, game }) {
    /*if (DEBUG)*/ console.log('Info Box: constructor', pixel);

    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.parent = parent;
    this.updateTimeout = null;
    this.UIs = ['purchaseUI', 'ownerUI', 'bidUI', 'activeBidUI'];

    // Pixel relationship
    this.pixel = pixel;
    this.pixel.infobox = this;
    console.log('InfoBox pixel', pixel);

    this.setupDom();
  }

  async init() {
    //this.setPosition();

    // Set UI based on pixel / context
    await this.setUI();
  }

  setupDom() {
    if (DEBUG) console.log('Info Box: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('info-box');

    this.position = document.createElement('div');
    this.position.classList.add('position');
    this.position.innerHTML = `${this.pixel.position} <small>| &nbsp;${this.pixel.bid || 1} $COLAB</small>`;

    this.domElement.append(this.position);

    this.arrow = document.createElement('i');
    this.arrow.classList.add('arrow');
    this.domElement.append(this.arrow);

    this.closeBtn = document.createElement('i');
    this.closeBtn.classList.add('gg-close-r');
    this.domElement.append(this.closeBtn);

    // Need this for remove to work
    this.clearSelectionListener = this.game.selection.clearActiveSelection.bind(this.game.selection);

    this.closeBtn.addEventListener('click', this.clearSelectionListener);

    this.loadingIcon = new LoadingBar();

    this.parent.append(this.domElement);
  }

  async setUI(refresh) {
    if (DEBUG) console.log('Info Box: setUI');

    if (this.hasUI())
      this.resetUI();

    this.domElement.append(this.loadingIcon);
    this.setPosition();

    if (this.pixel.loadingGraph)
      return;

    if (refresh || !this.pixel.graphLoaded)
      await this.pixel.loadGraphData(refresh)

    this.domElement.removeChild(this.loadingIcon);

    this.colorPicker = new ColorPicker(this.pixel, 'color', {
      width: '100%',
      type: 'color',
      scene: this.scene,
      elClasses: ['color-picker'],
      /*focus: () => {
        _self.setPosition();
      },
      blur: () => {
        _self.setPosition();
      },*/
      update: (value) => {
        _self.pixel.changeToColorNumber(value)

        if (_self.applyBtn)
          _self.applyBtn.domElement.disabled = false;
      }
    });

    this.domElement.append(this.colorPicker.domElement);

    this.setPosition();
  }

  setPosition() {
    if (DEBUG) console.log('Info Box: setPosition');

    const padding = 2;
    const vertical = (this.pixel.y > (this.parent.offsetHeight / 2)) ? 'bottom' : 'top';
    const horizontal = (this.pixel.x > (this.parent.offsetWidth / 2)) ? 'right' : 'left';
    //const animationClass = (vertical === 'up') ? 'fadeInUp' : 'fadeInDown';
    const top = (vertical === 'bottom') ? this.pixel.y - this.domElement.offsetHeight - padding : this.pixel.y + this.scene.size + padding;
    const left = (horizontal === 'right') ? this.pixel.x - this.domElement.offsetWidth - padding : this.pixel.x + this.scene.size + padding;

    Object.assign(this.domElement.style, { top: top + 'px', left: left + 'px' });
    this.domElement.classList.add(vertical, horizontal);
  }

  destroy() {
    if (DEBUG) console.log('Info box: destroy');

    this.closeBtn.removeEventListener('click', this.clearSelectionListener);
    this.parent.removeChild(this.domElement);

    if (this.pixel)
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
        this.domElement.removeChild(this[ui]);
        this.domElement.classList.remove(ui);
        this[ui] = null;
      }
    }
  }
}