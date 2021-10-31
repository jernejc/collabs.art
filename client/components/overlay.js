import Slideshow from './slideshow';

export default class Overlay {
  constructor({ game, parent, close }) {
    if (DEBUG) console.log('Overlay: constructor');

    if (close)
      this.close = close;
    if (parent)
      this.parent = parent;
    if (game)
      this.game = game;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'overlay');

    this.setupDom();
  }

  setupDom() {
    this.overlayContent = document.createElement('div');
    this.overlayContent.classList.add('overlay-content');

    this.slideshow = new Slideshow({parent: this.overlayContent, game: this.game});

    this.overlayNav = document.createElement('div');
    this.overlayNav.classList.add('overlay-nav');

    this.closeOverlay = document.createElement('button');
    this.closeOverlay.textContent = 'Close';

    const _self = this;

    this.closeOverlay.addEventListener('click', () => {
      if (_self.close)
        _self.close();
    });

    this.overlayNav.append(this.closeOverlay);

    this.overlayContent.append(this.overlayNav);
    this.domElement.append(this.overlayContent);

    this.parent.append(this.domElement);
  }

  destroy() {
    this.closeOverlay.removeEventListener('click', this.closeOverlay);

    if (this.slideshow) 
      this.slideshow.destroy();

    this.parent.removeChild(this.domElement);
  }
}