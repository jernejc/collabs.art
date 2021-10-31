
export default class Button {
  constructor({ elClasses, text, iconClass, clickAction }) {
    this.loadingUI = document.createElement('i');
    this.loadingUI.classList.add('gg-loadbar-alt');

    this.domElement = document.createElement('button');
    this.domElement.classList.add(...elClasses); // 'action-button'

    this.triggerActionListener = this.triggerAction.bind(this); // For removeEventListener to work

    if (iconClass) 
      this.setIcon(iconClass);
    if (clickAction)
      this.setClickAction(clickAction);
    if (text)
      this.setText(text);
  }

  loading() {
    this.domElement.innerHTML = '';
    this.domElement.disabled = true;
    this.domElement.append(this.loadingUI);
  }

  async triggerAction() {
    if (!this.clickAction)
      throw new Error('No action set');

    this.loading();

    try {
      await this.clickAction();
    } catch (error) {
      console.error('Button ClickAction failed', error)
    }

    this.reset();
  }

  setText(text) {
    this.text = text || this.text;
    this.domElement.textContent = this.text;
  }

  setIcon(iconClass) {
    this.iconClass = iconClass || this.iconClass;

    if (this.iconClass.search('gg-') > -1) {
      const icon = document.createElement('i');
      icon.classList.add(this.iconClass);

      this.domElement.innerHTML = '';
      this.domElement.append(icon);
    } else {
      const image = document.createElement('img');
      image.src = `assets/images/icons/${this.iconClass}.svg`;

      this.domElement.innerHTML = '';
      this.domElement.append(image);
    }
  }

  setClickAction(action) {
    if (DEBUG) console.log('Button: setClickAction');

    if (!action)
      throw new Error('No action provided.');

    if (this.clickAction)
      this.domElement.removeEventListener('click', this.triggerActionListener);

    this.clickAction = action;
    this.domElement.addEventListener('click', this.triggerActionListener);
  }

  reset() {
    //this.domElement.removeChild(this.loadingUI);
    this.domElement.disabled = false;

    if (this.text)
      this.domElement.textContent = this.text;
    if (this.iconClass)
      this.setIcon();
  }

  destroy() {
    this.domElement.removeEventListener('click', this.triggerActionListener);
    this.domElement.innerHTML = '';
  }
}