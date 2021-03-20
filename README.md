# PixelWorld

The world is a grid of 1.000.000 pixels, where each pixel is represented by a non-fungible token (NFT) on the Ethereum network. Ownership is stored and transfered based on the <a href="https://eips.ethereum.org/EIPS/eip-721">ERC-721 standard</a> as most digital art and collectibles. It cannot be taken away or destroyed. 

Each position has unique identifier within the grid:

<pre>
    0 →              999
  A ┌──────────────────┐  
  ↓ │                  │  Horizontal axis are numbers from 0 to 999.
    │    TN220         │  Vertical axis are letters from A to ALK.
    │     ┌─┐          │  
    │     └─┘          │  Example ID: <b>TN220</b>
    │                  │  Vertical: <b>TN</b> Horizontal: <b>220</b>
    │                  │  
ALK └──────────────────┘ 
</pre>

Within the same <a href="https://en.wikipedia.org/wiki/Smart_contract">smart contract</a> owners can set colors to their pixels and thus contribute to the final outlook of the world.