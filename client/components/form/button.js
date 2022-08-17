
import logger from '@util/logger';

export default class Button {
  constructor({ elClasses, text, icon, disabled, clickAction }) {
    this.loadingUI = document.createElement('i');
    this.loadingUI.classList.add('gg-loadbar-alt');

    this.domElement = document.createElement('button');
    this.domElement.classList.add(...elClasses); // 'action-button'

    this.triggerActionListener = this.triggerAction.bind(this); // For removeEventListener to work

    if (disabled)
      this.defaultDisabled = disabled;
    if (this.defaultDisabled)
      this.domElement.disabled = true;
    if (icon)
      this.setIcon(icon);
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
      logger.error('Button ClickAction failed', error)
    }

    this.reset();
  }

  setText(text) {
    this.text = text || this.text;

    if (this.icon) {
      this.setIcon(this.icon)
      return;
    }

    this.domElement.textContent = this.text;
  }

  setIcon(icon, alertAction) {
    if (this.icon)
      this.domElement.classList.remove(this.icon.replace('gg-', ''));
      
    this.icon = icon || this.icon;

    if (this.icon.search('gg-') > -1) {
      const icon = document.createElement('i');
      icon.classList.add(this.icon);

      this.domElement.innerHTML = '';
      this.domElement.append(icon);
    } else {
      const image = document.createElement('img');
      image.src = `assets/images/icons/${this.icon}`;

      this.domElement.innerHTML = '';
      this.domElement.append(image);
    }

    if (this.text) {
      this.domElement.innerHTML += this.text;
    }

    this.domElement.classList.add(this.icon.replace('gg-', ''));

    if (alertAction) {
      this.alertIcon = document.createElement('i');
      this.alertIcon.classList.add('gg-chevron-double-up');
      this.domElement.append(this.alertIcon);
    }
  }

  setClickAction(action) {
    logger.log('Button: setClickAction');

    if (!action)
      throw new Error('No action provided.');

    if (this.clickAction)
      this.domElement.removeEventListener('click', this.triggerActionListener);

    this.clickAction = action;
    this.domElement.addEventListener('click', this.triggerActionListener);
  }

  toggleDisabled() {
    this.domElement.disabled = !this.domElement.disabled;
  }

  reset() {
    if (this.text)
      this.domElement.textContent = this.text;
    if (this.icon)
      this.setIcon();
    if (this.defaultDisabled)
      this.domElement.disabled = true;
    else
      this.domElement.disabled = false;
  }

  destroy() {
    this.domElement.removeEventListener('click', this.triggerActionListener);
    this.domElement.innerHTML = '';
  }
}