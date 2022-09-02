
/**
 * Listen to Pixel and PixelBid contract events and response if needed
 * Supported events:
 *   - ColorPixels - generate a png image of world based on event pixels/colors
 */

require('dotenv').config()

// Local helpers
const { CORSconfig } = require('./helpers');
// Routes
const { getImage } = require('./routes');
// Listeners
const { canvasContractListeners } = require('./listeners');

// Start listening for network events
(async () => {
  console.log('Init Event Listeners!');
  try {
    // Init web3 and contract(s)
    await canvasContractListeners()
  } catch (error) {
    console.error('Failed to init Pixels contract', error);
    return;
  }
})();

// Expose simple express server
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors(CORSconfig));

// Return latest world image
app.get('/image', getImage);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`ExpressApp listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;