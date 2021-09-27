# Events
Separate module that runs on a proprietary server and listens to specifc Pixels and PixelBids contract events.

## List of supported events

### ColorPixels
Is passed in an array of positions and colors. Uses Jimp [www.npmjs.com/package/jimp](https://www.npmjs.com/package/jimp) to load and manipulate the world image.
Finally uploads the back to IPFS for the webapp to download and use.

# Express

`GET: /image`<br />
Used to return the latest world image.