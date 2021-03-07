
import web3 from 'web3';

// https://stackoverflow.com/questions/9905533/convert-excel-column-alphabet-e-g-aa-to-number-e-g-25
export function letterToNumberColumn(columnLetter) {
  let base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, columnNumber = 0;

  for (i = 0, j = columnLetter.length - 1; i < columnLetter.length; i += 1, j -= 1)
    columnNumber += Math.pow(base.length, j) * (base.indexOf(columnLetter[i]) + 1);

  return columnNumber;
};

// https://stackoverflow.com/questions/181596/how-to-convert-a-column-number-e-g-127-into-an-excel-column-e-g-aa
export function numberToLetterColumn(columnNumber) {
  let dividend = columnNumber, columnLetter = '', modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLetter = String.fromCharCode(65 + modulo).toString() + columnLetter;
    dividend = parseInt((dividend - modulo) / 26);
  }

  return columnLetter;
}

export function formatPositionHex(hex) {
  const string = hexToString(hex);

  return {
    hex,
    ...formatPosition(string)
  }
}

export function formatPosition(string) {
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
    cx: x,
    cy: y
  }
}

export function formatExpireDate(endTime) { // end time in seconds
  const _second = 1000,
    _minute = _second * 60,
    _hour = _minute * 60,
    _day = _hour * 24,
    end = new Date(endTime * 1000),
    now = new Date(),
    distance = end - now;

  if (distance < 0)
    return '-';

  const days = Math.floor(distance / _day),
    hours = Math.floor((distance % _day) / _hour),
    minutes = Math.floor((distance % _hour) / _minute),
    seconds = Math.floor((distance % _minute) / _second);

  let string = '';

  // This needs better logic
  if (days > 0) {
    string = `${(hours > 0 && hours > 13) ? days + 1 : days}d`;
  } else if (hours > 0) {
    string = `${(minutes > 0 && minutes > 30) ? hours + 1 : hours}h`;

    /*if (minutes > 0)
      string += ` ${minutes}m`;*/
  } else if (minutes > 0) {
    string = `${(seconds && seconds > 30) ? minutes + 1 : minutes}m`;

    /*if (seconds > 0)
      string += ` ${seconds}s`;*/
  } else {
    string = `${seconds}s`;
  }

  return string;
}

// Normalize beetwen min, max
export function normalize(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

// Convert string to BigNumber, should be fine for short strings
export function stringToBN(string) {
  return web3.utils.toBN(web3.utils.stringToHex(string)).toNumber(); // There has to be another way of doing this
}

export function hexToString(hex) {
  return web3.utils.hexToString(hex);
}

export function stringToHex(string) {
  return web3.utils.stringToHex(string);
}

export function toWei(price, currency) {
  return web3.utils.toWei(price, currency || "ether");
}

export function formatColorNumber(hex) {
  let string = hex.toString(16);

  if (string.length < 6)
    string = string.padStart(6, "0");

  return string;
}

export function fromWei(number) {
  return web3.utils.fromWei(number);
}

export async function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

// Insert after html node
export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}