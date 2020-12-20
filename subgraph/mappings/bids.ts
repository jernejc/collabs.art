import { Purchase, BidCreated } from '../generated/PixelsBid/PixelsBid'
import { Pixel, Bid } from '../generated/schema'

export function handlePixelPurchase(event: Purchase): void {
  let pixel = new Pixel(event.params._position.toHex())

  pixel.owner = event.params._payer
  pixel.price = event.params._amount
  pixel.color = event.params._color

  pixel.save()
}

export function handleBidCreated(event: BidCreated): void {
  let pixel = Pixel.load(event.params._position.toHex())
  let bid = new Bid(pixel.id + "-" + event.logIndex.toString())

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
