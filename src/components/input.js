
import Controller from '@components/controller';

/**
 * Input Class
 */

export default class Input extends Controller {

  constructor(object, property, params) {

    super(object, property, params);

    const self = this;

    let prevY;

    this.input = document.createElement('input');

    if (params.type)
      this.input.setAttribute('type', params.type);
    else
      this.input.setAttribute('type', 'text');

    this.border = document.createElement('div');
    this.border.classList.add('input-border');

    this.domElement.appendChild(this.input);
    this.domElement.appendChild(this.border);
    this.domElement.classList.add('color-input');

    this.input.addEventListener('change', onChange);
    this.input.addEventListener('blur', onBlur);
    this.input.addEventListener('keydown', e => {
      if (e.keyCode === 13)
        onFinish();
    });

    if (params.mouseevents)
      this.input.addEventListener('mousedown', onMouseDown);

    this.updateDisplay();

    return this.domElement;

    // Helpers

    function onChange(value) {
      console.log('onChange', value, self.input.value)

      const attempted = value || parseFloat(self.input.value);

      if (!isNaN(attempted))
        self.setValue(attempted);
    }

    function onFinish() {
      if (self.onFinishChange)
        self.onFinishChange.call(self, self.getValue());
    }

    function onBlur() {
      onFinish();
    }

    function onMouseDrag(e) {
      const diff = prevY - e.clientY;
      self.setValue(self.getValue() + diff * self.step);

      prevY = e.clientY;
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseDrag);
      window.removeEventListener('mouseup', onMouseUp);
      onFinish();
    }

    function onMouseDown(e) {
      window.addEventListener('mousemove', onMouseDrag);
      window.addEventListener('mouseup', onMouseUp);
      prevY = e.clientY;
    }
  }

  updateDisplay() {
    let value = this.getValue();

    if (this.format)
      value = this.format(value);

    this.input.value = value;
    return super.updateDisplay();
  }
}