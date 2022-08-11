export default class Timer {
  constructor({ parent, game }) {
    if (DEBUG) console.log('Timer: constructor');

    if (parent)
      this.parent = parent;
    if (game) {
      this.game = game;
      this.scene = this.game.scene.keys['MainScene'];
    }

    this.today = new Date();
    this.lastDayOfMonth = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);
    this.interval = this.scene.time.addEvent({
      delay: 1000,
      callback: this.updateTime,
      callbackScope: this,
      loop: true
    });

    this.setupDom();
    this.updateTime();
  }

  setupDom() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('timer');

    this.parent.append(this.domElement);
  }

  updateTime() {
    // Get today's date and time
    const now = new Date().getTime();

    // Find the distance between now and the count down date
    const distance = this.lastDayOfMonth - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    this.domElement.innerHTML = days + "d " + hours + "h "
      + minutes + "m " + seconds + "s ";

    // If the count down is finished, write some text
    if (distance < 0) {
      this.domElement.innerHTML = "EXPIRED";
    }
  }

  destroy() {
    if (DEBUG) console.log("Timer: destroy");

    if (this.interval) {
      this.scene.time.removeEvent(this.interval);
      this.interval = null;
    }

    if (this.parent) {
      this.parent.removeChild(this.domElement);
      this.domElement = null;
    }
  }
}