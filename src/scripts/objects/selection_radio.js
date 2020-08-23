import { constant } from "lodash";


export default class SelectionRadio {

  constructor(object, property, options) {

    this.domElement = document.createElement('div');
    this.domElement.classList.add('selection-radio');

    if (!Array.isArray(options))
      throw new Error('Options need to be an array');

    options.forEach(option => {
      const radiobox = document.createElement('input');
      radiobox.type = 'radio';
      radiobox.id = option.value;
      radiobox.value = option.value;
      radiobox.name = option.name;

      const label = document.createElement('label')
      label.htmlFor = option.value;

      const labelText = document.createTextNode(option.text);
      label.appendChild(labelText)

      this.domElement.appendChild(radiobox);
      this.domElement.appendChild(label);
    });

    return this.domElement;
  }
}