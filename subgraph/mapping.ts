import { Purchase } from './generated/PixelsBid/PixelsBid'
import { Pixel } from './generated/schema'

export function handlePixelPurchase(event: Purchase): void {
  let pixel = new Pixel(event.params._position.toHex())
  pixel.owner = event.params._payer
  pixel.amount = event.params._amount
  pixel.save()
}
