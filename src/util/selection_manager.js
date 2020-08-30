
import { displayInfoBox } from '@actions/pixel'

export default class SelectionManager {

  constructor() {
    this.selection = [];
    this.infobox;
  }

  add(pixel, scene) {
    //console.log('SelectionManager add', pixel);

    if (!pixel.tile)
      return;

    if (!this.isSelected(pixel.tile))
      this.selection = [pixel.tile.id];

    this.infobox = displayInfoBox({ pixel, scene })

    //console.log('this.selection', this.selection);
  }

  remove(pixel) {
    //console.log('SelectionManager remove', pixel);

    if (!pixel.tile)
      return;

    if (this.isSelected(pixel.tile))
      this.selection = this.selection.filter(id => id != pixel.tile.id);

    this.infobox.destroy();
  }

  isSelected(tile) {
    //console.log('isSelected', tile)
    return this.selection.includes(tile.id);
  }

  reset() {
    //console.log('reset selection');
    this.selection = [];
  }
}