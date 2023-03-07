
import { ethers } from "ethers";

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

export function formatShortAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4);
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

export function getGridSize({ gridSize, strokeSize }) {
  if (window.devicePixelRatio > 1) {
    // GridSize calc
    // Size needs to be different based on screen resolution
    gridSize = parseInt(gridSize + (gridSize * 0.2) / window.devicePixelRatio);
    strokeSize = strokeSize - (gridSize * 0.2 / window.devicePixelRatio);
  }

  return { gridSize, strokeSize }
}

// Normalize beetwen min, max
export function normalize(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

// Convert string to BigNumber, should be fine for short strings
export function stringToBN(string) {
  return ethers.BigNumber.from(stringToHex(string)).toNumber(); // There has to be another way of doing this
}

export function hexToString(hex) {
  return ethers.utils.toUtf8String(hex);
}

export function stringToHex(string) {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(string))
}

export function numberToHex(string) {
  return ethers.utils.hexlify(string);
}

export function toWei(price, currency) {
  return ethers.utils.parseUnits(price, currency || "ether");
}

export function formatColorNumber(hex) {
  let string = hex.toString(16);

  if (string.length < 6)
    string = string.padStart(6, "0");

  return string;
}

export function colorToHexString(color) {
  return Phaser.Display.Color.RGBToString(color.r, color.g, color.b, color.a);
}

export function hexStringToColor(hex) {
  return Phaser.Display.Color.HexStringToColor(hex);
}

export async function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

// Insert after html node
export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Cookies
// https://stackoverflow.com/questions/4825683/how-do-i-create-and-read-a-value-from-cookie

export function setCookie(name, value, days = 7, path = '/') {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path
}

export function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '')
}

export function deleteCookie(name, path) {
  setCookie(name, '', -1, path)
}

export function pushGTMEvent(category, action, scene) {
  dataLayer.push({
    'event': action,
    'eventCategory': category,
    'currentStateTag': scene.game.web3.currentStateTag,
    'walletBalance': scene.game.web3.walletBalance,
    'activeChangesCount': scene.game.selection.activeChangesCount
  });
}

// Blinkering issue in some android browser
// WEBGL rendering seems to be connected
// https://www.html5gamedevs.com/topic/25507-phaserwebgl-flickering-on-chrome-for-android-v53/

export function maliDetect() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute("width", "1");
  canvas.setAttribute("height", "1");
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl', { stencil: true });
  canvas.parentNode.removeChild(canvas);

  if (!gl)
    return false;

  const dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
  let renderer;

  if (dbgRenderInfo != null)
    renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);

  if (!renderer)
    return false;

  let n = renderer.search("Mali-400");

  if (n != -1)
    return true;
  else
    return false;
}

export function formatNetworkConfig(config) {
  return ['chainId', 'chainName', 'nativeCurrency', 'rpcUrls', 'blockExplorerUrls']
    .reduce((result, key) => {
      result[key] = config[key];
      return result;
    }, {});
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function detectMob() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}
