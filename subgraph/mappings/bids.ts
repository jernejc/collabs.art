import { BidCreated } from '../generated/PixelsBid/PixelsBid'
import { Pixel, Bid } from '../generated/schema'

export function handleBidCreated(event: BidCreated): void {
  let pixel = Pixel.load(event.params._position.toHex())

  if (pixel !== null) {
    let bid = new Bid(pixel.id + "-" + event.logIndex.toString())

    if (bid !== null) {
      bid.accepted = false
      bid.canceled = false
      bid.expiresAt = event.params._expiresAt
      bid.pixel = pixel.id
      bid.bidder = event.params._bidder
      bid.amount = event.params._amount
      bid.save()

      pixel.highestBid = bid.id
      pixel.save()
    }
  }
}
