
export default class Button {
  constructor({ elClasses, text, iconClass, clickAction }) {
    this.loadingI = document.createElement('i');
    this.loadingI.classList.add('gg-loadbar-alt');

    this.button = document.createElement('button');
    this.button.classList.add(...elClasses); // 'action-button'

    if (text) {
      this.text = text;
      this.button.textContent = text;
    }
    if (iconClass) {
      this.iconClass = iconClass;
      this.setIcon();
    }
    if (clickAction) {
      this.button.addEventListener('click', async e => {
        this.loading();

        try {
          await clickAction();
        } catch (error) {
          console.error('Button ClickAction failed', error)
        }

        this.reset();
      });
    }

    return this.button;
  }

  loading() {
    if (this.text)
      this.button.textContent = '';
    if (this.icon)
      this.button.removeChild(this.icon);

    this.button.disabled = true;
    this.button.appendChild(this.loadingI);
  }

  reset() {
    this.button.removeChild(this.loadingI);
    this.button.disabled = false;

    if (this.text)
      this.button.textContent = this.text;
    if (this.iconClass)
      this.setIcon();
  }

  setIcon() {
    this.icon = document.createElement('i');
    this.icon.classList.add(this.iconClass);
    this.button.appendChild(this.icon);
  }
}