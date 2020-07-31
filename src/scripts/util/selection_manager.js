
export default class SelectionManager {

  constructor() {
    this.selection = [];
  }

  add(pixel) {
    console.log('SelectionManager add', pixel);

    if (!pixel.tile)
      return;

    if (!this.isSelected(pixel.tile))
      this.selection.push(pixel.tile.id);

    console.log('this.selection', this.selection);
  }

  remove(pixel) {
    console.log('SelectionManager remove', pixel);

    if (!pixel.tile)
      return;

    if (this.isSelected(pixel.tile))
      this.selection = this.selection.filter(id => id != pixel.tile.id);
  }

  isSelected(tile) {
    //console.log('isSelected', tile)
    return this.selection.includes(tile.id);
  }
}