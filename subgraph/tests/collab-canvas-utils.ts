import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  ColorPixels,
} from "../generated/CollabCanvas/CollabCanvas"

export function createColorPixelsEvent(
  positions: Array<BigInt>,
  colors: Array<Bytes>,
  bids: Array<BigInt>,
  owner: Address
): ColorPixels {
  let colorPixelsEvent = changetype<ColorPixels>(newMockEvent())

  colorPixelsEvent.parameters = new Array()

  colorPixelsEvent.parameters.push(
    new ethereum.EventParam(
      "positions",
      ethereum.Value.fromUnsignedBigIntArray(positions)
    )
  )
  colorPixelsEvent.parameters.push(
    new ethereum.EventParam(
      "colors",
      ethereum.Value.fromFixedBytesArray(colors)
    )
  )
  colorPixelsEvent.parameters.push(
    new ethereum.EventParam(
      "bids",
      ethereum.Value.fromUnsignedBigIntArray(bids)
    )
  )
  colorPixelsEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return colorPixelsEvent
}
