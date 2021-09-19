
/**
 * Listen to Pixel and PixelBid contract events and response if needed
 * Supported events:
 *   - ColorPixels - generate a png image of world based on event pixels/colors
 */

// Express server
const express = require('express');
// Local helpers
const { findWorldImage } = require('./helpers');
// Listeners
const { pixelsContractListeners } = require('./listeners');

// Start listening for network events
(async () => {
  console.log('Init Event Listeners!');
  try {
    // Init web3 and contract(s)
    await pixelsContractListeners()
  } catch (error) {
    console.error('Failed to init Pixels contract', error);
    return;
  }
})();

// Expose simple express server
const app = express();

// Return latest world image
app.get('/image', async (req, res) => {  
  try {
    const worldImage = await findWorldImage();
    const config = {
      action: 'read',
      expires: '03-17-2025',
    };

    const url = await worldImage.getSignedUrl(config);
    res.redirect(url[0]);
  } catch (error) {
    console.error('Failed to redirect', error);
    res.status(500).end()
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;