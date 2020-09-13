
import { displayInfoBox } from '@actions/pixel'

export default class SelectionManager {

  constructor() {
    this.selection = [];
    this.infobox;
  }

  add(pixels, scene) {
    console.log('SelectionManager add', pixels);

    if (!pixels || pixels.length === 0)
      return;

    if (pixels.length === 1) { // single pixel
      const pixel = pixels[0];

      if (!this.isSelected(pixel.tile))
        this.selection = [pixel];
    } else if (pixels.length > 1) {
      this.selection = pixels;
      this.rectangle = true;
    }

    this.infobox = displayInfoBox({ pixels: this.selection, scene })

    //console.log('this.selection', this.selection);
  }

  remove(pixel) {
    console.log('SelectionManager remove', pixel);

    if (!pixel.tile)
      return;

    if (this.isSelected(pixel.tile))
      this.selection = this.selection.filter(selection => selection.tile.id != pixel.tile.id);

    this.infobox.destroy();
  }

  isSelected(tile) {
    //console.log('isSelected', tile)
    return this.ids.includes(tile.id);
  }

  reset() {
    console.log('reset selection', this.selection);
    const self = this;

    if (this.selection.length > 0) 
      this.selection.forEach(pixel => {
        console.log('reset loop pixel', pixel)
        self.remove(pixel)
      });
    

    this.selection = [];
    this.rectangle = false;
  }

  get ids() {
    return this.selection.map(pixel => pixel.tile.id)
  }
}