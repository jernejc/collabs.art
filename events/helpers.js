
const Web3 = require('web3');
const Jimp = require('jimp');

const {Storage} = require('@google-cloud/storage');

// Instantiate a storage client
const storage = new Storage();

// A bucket is a container for objects (files).
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// Config
const config = require('./config');

// Needs refractor, copy of client/helpers
module.exports = {
  formatPosition,
  letterToNumberColumn,
  colorPixel,
  updateWorldImage,
  loadWorldImage,
  findWorldImage,
  CORSorigin,
  getImage
}

function formatPosition(string) {
  let y = string.match(/[A-Z]/g);

  if (!y)
    y = 0
  else
    y = letterToNumberColumn(y.join(''));

  let x = string.match(/[^A-Z]/gi);

  if (!x)
    x = 0
  else
    x = parseInt(x.join(''));

  return {
    string,
    x,
    y
  }
}

function letterToNumberColumn(columnLetter) {
  let base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, columnNumber = 0;

  for (i = 0, j = columnLetter.length - 1; i < columnLetter.length; i += 1, j -= 1)
    columnNumber += Math.pow(base.length, j) * (base.indexOf(columnLetter[i]) + 1);

  return columnNumber;
};

function colorPixel(position, color, worldImage) {
  const positionString = Web3.utils.hexToUtf8(Web3.utils.numberToHex(position)),
    colorString = Web3.utils.hexToUtf8(color),
    colorInt = parseInt(colorString + 'ff', 16),
    positionInfo = formatPosition(positionString);

  console.log('Color Pixel', positionInfo, colorString);

  worldImage.setPixelColor(colorInt, positionInfo.x, positionInfo.y);
}

async function updateWorldImage(worldImage, ipfs) {
  const imageBuffer = await worldImage.getBufferAsync(Jimp.MIME_PNG);
  const response = await ipfs.add({
    content: imageBuffer
  });

  await updateGoogleStorage(`${config.assests}/worlds/${response.cid}.png`, imageBuffer);
  console.log('World image pixels updated!');
}

async function updateGoogleStorage(path, buffer) {
  try {
    await bucket.deleteFiles({
      prefix: `${config.assests}/worlds/`
    })
  
    const file = bucket.file(path);
    await file.save(buffer);
  } catch (error) {
    console.error('Failed to update Google storage', error)
  }
}

async function loadWorldImage() {
  let buffer;

  try {
    // Get world image path
    const worldImage = await findWorldImage()
    buffer = await worldImage.download();

    if (!buffer)
      throw new Error('Missing image buffer')
  } catch (error) {
    console.error('No world image not found', error);
    return;
  }

  // Load world image
  const jimpImage = await Jimp.read(buffer[0]);
  console.log('Image loaded.');

  return jimpImage;
}

async function findWorldImage() {
  let worldImage, images;

  try {
    images = await bucket.getFiles({
      prefix: `${config.assests}/worlds`
    });
  } catch (error) {
    console.warn('Failed to get files', error)
  }

  if (images && images.length > 0) {
    if (images[0].length > 0)
      worldImage = images[0][0];
  }

  if (!worldImage) {
    console.warn('Defaulting to blank image');
    worldImage = bucket.file(`${config.assests}/blank.png`);
  } else {
    console.log('Found an existing world image', worldImage.name);
  }

  return worldImage
}

// Express

// https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b
function CORSorigin(origin, callback) {
  // allow requests with no origin 
  // (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  if (config.allowedOrigins.indexOf(origin) === -1) {
    const msg = 'The CORS policy for this site does not ' +
      'allow access from the specified Origin.';
    return callback(new Error(msg), false);
  }
  return callback(null, true);
}


async function getImage(req, res)  {  
  try {

    const file = await findWorldImage();
    const stream = file.createReadStream();

    res.writeHead(200, {'Content-Type': 'image/png' });

    stream.on('data', function (data) {
      res.write(data);
    });

    stream.on('error', function (err) {
      console.log('error reading stream', err);
    });

    stream.on('end', function () {
      res.end();
    });
  } catch (error) {
    console.error('Failed to redirect', error);
    res.status(500).end()
  }
}