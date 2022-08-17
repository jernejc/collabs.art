import logger from "@util/logger";
import Button from "./form/button";
import Input from "./form/input";

export default class TokenInfo {

  constructor({ parent }) {
    logger.log('TokenInfo: constructor');

    this.parent = parent;

    this.setupDom();
  }

  setupDom() {
    logger.log('TokenInfo: setupDom');

    this.domElement = document.createElement('div');
    this.domElement.classList.add('colab-info');
    this.domElement.innerHTML = '$COLAB token is used to draw on the canvas, you can get it <b>FREE mint</b>, by connecting your Twitter account or come say hi on our Discord channel.';

    this.twitterButton = new Button({
      icon: 'twitter-logo.png',
      text: 'Connect',
      elClasses: ['action-button', 'social-connect', 'twitter']
    })

    this.domElement.append(this.twitterButton.domElement)
    
    this.discordButton = new Button({
      icon: 'discord-icon.png',
      text: 'Say "hi"',
      elClasses: ['action-button', 'social-connect', 'discord']
    })

    this.domElement.append(this.discordButton.domElement);

    this.supportForm = {
      value: 0.11
    }

    this.supportInput = new Input(this.supportForm, 'value', {
      type: 'number',
      step: 0.11,
      onChange: async () => {
        console.log('onChange support form Input');
      }
    });
    this.domElement.append(this.supportInput);

    this.parent.append(this.domElement);
  }

  destroy() {
    logger.log('TokenInfo: destroy');

    this.parent.removeChild(this.domElement);
  }

}