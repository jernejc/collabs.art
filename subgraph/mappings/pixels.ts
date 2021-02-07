import { ColorPixel, TransferBatch } from '../generated/Pixels/Pixels'
import { Pixel } from '../generated/schema'

export function handlePixelTransferBatch(event: TransferBatch): void {
  let tokens = event.params._tokenIds;

  for (let i = 0; i < tokens.length; i++) {
    let pixel = new Pixel(tokens[i].toHex())
    pixel.owner = event.params._to
    pixel.save()
  }
}

export function handleColorPixel(event: ColorPixel): void {
  let pixel = Pixel.load(event.params._position.toHex())
  pixel.color = event.params._color
  pixel.save()
}
