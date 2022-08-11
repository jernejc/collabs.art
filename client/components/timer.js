export default class Timer {
  constructor({ parent, close }) {
    if (DEBUG) console.log('Timer: constructor');

    if (close)
      this.close = close;
    if (parent)
      this.parent = parent;

    this.setupDom();
  }

  setupDom() {
    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'timer');

    this.parent.append(this.domElement);
  }

  destroy() {
    if (DEBUG) console.log("Timer: destroy");

    if (this.slideshow)
      this.slideshow.destroy();

    if (this.parent)
      this.parent.removeChild(this.domElement);
  }
}