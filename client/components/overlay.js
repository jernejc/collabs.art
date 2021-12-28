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

    this.slideshow = new Slideshow({ parent: this.overlayContent, game: this.game, buttonAction: this.close });

    this.insipredBy = document.createElement('div');
    this.insipredBy.id = 'inspired-by';

    this.insipredBy.innerHTML = `
      Inspired by <a href="https://en.wikipedia.org/wiki/Poietic_Generator" target="_blank">Poietic Generator</a> 
      and 
      <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life" target="_blank">Game of Life</a>
    `

    this.overlayContent.append(this.insipredBy);
    this.domElement.append(this.overlayContent);

    this.parent.append(this.domElement);
  }

  destroy() {
    if (this.slideshow)
      this.slideshow.destroy();

    this.parent.removeChild(this.domElement);
  }
}