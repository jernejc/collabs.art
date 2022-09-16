import {
  ColorPixel,
  ColorPixels,
} from "../generated/CollabCanvas/CollabCanvas"
import { Pixel } from "../generated/schema"

export function handleColorPixel(event: ColorPixel): void {
  const position = event.params.position;
  const color = event.params.color;
  const bid = event.params.bid;
  const owner = event.params.owner;

  let pixel = Pixel.load(position.toHex());

  if (pixel === null) {
    pixel = new Pixel(position.toHex());
  }

  pixel.color = color;
  pixel.owner = owner;
  pixel.bid = bid;

  pixel.save();
}

export function handleColorPixels(event: ColorPixels): void {
  const positions = event.params.positions;
  const colors = event.params.colors;
  const bids = event.params.bids;
  const owner = event.params.owner;

  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== null && colors[i] !== null) {
      let pixel = Pixel.load(positions[i].toHex());

      if (pixel === null) {
        pixel = new Pixel(positions[i].toHex());
      }

      pixel.color = colors[i];
      pixel.owner = owner;
      pixel.bid = bids[i];

      pixel.save();
    }
  }
}