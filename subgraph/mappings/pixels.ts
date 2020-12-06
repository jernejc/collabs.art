import { ColorPixel } from '../generated/Pixels/Pixels'
import { Pixel } from '../generated/schema'

export function handleColorPixel(event: ColorPixel): void {
  let pixel = Pixel.load(event.params._position.toHex())
  pixel.color = event.params._color
  pixel.save()
}
