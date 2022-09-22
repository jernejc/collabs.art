
import logger from '@util/logger';
import config from '@util/config';

export default class Button {
  constructor({ elClasses, text, icon, disabled, caption, tooltip, tooltipFlow, clickAction }) {
    this.loadingUI = document.createElement('i');
    this.loadingUI.classList.add('gg-loadbar-alt');

    this.domElement = document.createElement('button');

    if (elClasses)
      this.domElement.classList.add(...elClasses);

    this.triggerActionListener = this.triggerAction.bind(this); // For removeEventListener to work

    if (disabled)
      this.disabled = disabled;
    if (this.disabled)
      this.domElement.setAttribute('disabled', 'disabled');
    if (icon)
      this.setIcon(icon);
    if (clickAction)
      this.setClickAction(clickAction);
    if (text)
      this.setText(text);
    if (tooltip)
      this.setToolTip(tooltip, tooltipFlow)
    if (caption)
      this.setCaption(caption)
  }

  loading() {
    this.isLoading = true;
    this.domElement.innerHTML = '';
    this.domElement.setAttribute('disabled', 'disabled');
    this.domElement.append(this.loadingUI);
  }

  async triggerAction() {
    if (!this.clickAction)
      throw new Error('No action set');

    this.loading();

    try {
      await this.clickAction();
    } catch (error) {
      logger.error('Button ClickAction failed', error);
    }

    this.reset();
  }

  setCaption(caption) {
    this.caption = caption || this.caption;

    if (this.caption)
      this.domElement.innerHTML += `<span class="caption">${this.caption}</span>`;
  }

  setText(text) {
    this.text = text || this.text;

    if (this.icon) {
      this.setIcon(this.icon)
      return;
    } else {
      if (!this.domElement.classList.contains('info-text'))
        this.domElement.classList.add('info-text');
    }

    this.domElement.innerHTML += this.text;

    if (this.caption)
      this.setCaption();
  }

  setToolTip(tooltip, tooltipFlow) {
    this.domElement.setAttribute('tooltip', tooltip);

    if (tooltipFlow)
      this.domElement.setAttribute('flow', tooltipFlow);
  }

  setColor(color) {
    if (!this.domElement.classList.contains(color))
      this.domElement.classList.add(color)
  }

  setDisabled(disabled) {
    this.disabled = disabled;

    if (this.disabled)
      this.domElement.setAttribute('disabled', 'disabled');
    else
      this.domElement.removeAttribute('disabled');
  }

  clearColor(color) {
    if (this.domElement.classList.contains(color))
      this.domElement.classList.remove(color)
  }

  clearColors() {
    config.appConfig.btnColors.forEach(color => {
      this.clearColor(color);
    })
  }

  clearTooltip() {
    this.domElement.removeAttribute('tooltip');
  }

  clearIcon() {
    if (this.icon)
      this.domElement.classList.remove(this.icon.replace('gg-', ''));

    this.domElement.innerHTML = '';
    this.icon = null;
    this.text = null;
  }

  setIcon(icon, text, alertAction) {
    logger.log('Button: setIcon');

    config.appConfig.btnIcons.forEach(btnIcon => {
      this.domElement.classList.remove(btnIcon);
    });

    this.icon = icon || this.icon;

    if (text)
      this.text = text;

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

    const dotIndex = this.icon.indexOf('.');
    let className = this.icon.replace('gg-', '');

    if (dotIndex > -1)
      className = className.slice(0, dotIndex);

    this.domElement.classList.add(className);

    if (alertAction) {
      this.alertIcon = document.createElement('i');
      this.alertIcon.classList.add('gg-chevron-double-up');
      this.domElement.append(this.alertIcon);
    }

    if (this.caption)
      this.setCaption();
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

  reset() {
    if (this.isLoading) {
      this.isLoading = false;
      this.domElement.removeChild(this.loadingUI);
    }

    if (this.text)
      this.setText();
    if (this.icon)
      this.setIcon();
    if (this.caption)
      this.setCaption();
    if (this.connected) {
      if (!this.domElement.classList.contains('connected'))
        this.domElement.classList.add('connected');
    } else {
      if (this.domElement.classList.contains('connected'))
        this.domElement.classList.remove('connected');
    }

    this.setDisabled(this.disabled);
  }

  destroy() {
    this.domElement.removeEventListener('click', this.triggerActionListener);
    this.domElement.innerHTML = '';
  }
}