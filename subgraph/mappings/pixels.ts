import { ColorPixels, TransferBatch } from '../generated/Pixels/Pixels'
import { Pixel } from '../generated/schema'

export function handleTransferBatch(event: TransferBatch): void {
  let tokens = event.params._tokenIds;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== null) {
      let pixel = new Pixel(tokens[i].toHex());
      pixel.owner = event.params._to;
      pixel.save();
    }
  }
}

export function handleColorPixels(event: ColorPixels): void {
  let positions = event.params._positions;
  let colors = event.params._colors;

  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== null && colors[i] !== null) {
      let pixel = Pixel.load(positions[i].toHex());

      if (pixel !== null) {
        pixel.color = colors[i];
        pixel.save();
      }
    }
  }
}
