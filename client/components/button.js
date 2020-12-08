
export default class Button {
  constructor({ elClass, text, clickAction }) {
    this.text = text;
    this.loadingIcon = document.createElement('i');
    this.loadingIcon.classList.add('gg-loadbar-alt');

    this.button = document.createElement('button');
    this.button.classList.add(elClass, 'action-button');
    this.button.textContent = this.text;

    this.button.addEventListener('click', async e => {
      this.loading();
      await clickAction();
    });

    return this.button;
  }

  loading() {
    this.button.disabled = true;
    this.button.textContent = '';
    this.button.appendChild(this.loadingIcon);
  }

  reset() {
    this.button.textContent = this.text;
  }
}