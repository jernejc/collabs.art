
export default class Button {
  constructor({ elClass, text, clickAction }) {
    this.text = text;
    this.loadingI = document.createElement('i');
    this.loadingI.classList.add('gg-loadbar-alt');

    this.button = document.createElement('button');
    this.button.classList.add(elClass, 'action-button');
    this.button.textContent = this.text;

    this.button.addEventListener('click', async e => {
      this.loading();
      await clickAction();
      this.reset();
    });

    return this.button;
  }

  loading() {
    this.button.disabled = true;
    this.button.textContent = '';
    this.button.appendChild(this.loadingI);
  }

  reset() {
    this.button.removeChild(this.loadingI);
    this.button.disabled = false;
    this.button.textContent = this.text;
  }
}