
const Web3 = require('web3');

// Needs refractor, copy of client/helpers
module.exports = {
  formatPosition,
  letterToNumberColumn,
  colorPixel
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