
import _ from 'lodash';
import { ethers } from "ethers";

import { getTileForPointer } from '@actions/pixel';

import { formatColorNumber, pushGTMEvent } from '@util/helpers';

import logger from '@util/logger';
import config from '@util/config';

let downDelay = null;

export function handleMouseMove({ pointer, scene, noAutomatic }) {
  //logger.log('User interactions: handleMove', pointer, scene);

  if (downDelay && pointer.isDown) {
    clearTimeout(downDelay);
    downDelay = null;
  }

  if (pointer.isDown && scene.game.mode === 'select' && !noAutomatic) { // switch to move if mouse down
    scene.game.moveAutomatic = scene.game.mode;
    setGameMode({ scene, mode: 'move' });
  }

  switch (scene.game.mode) {
    case 'move':
      handleGameMoving({ scene, pointer });

      if (pointer.isDown)
        panDragMap({ pointer, scene });
      break;
    case 'gameoflife':
    case 'select':
      positionSelectionBlock({ pointer, scene });
      break;
    case 'mininav':
      handleGameMoving({ scene, pointer });

      if (pointer.isDown)
        navigateMinimap({ pointer, scene: scene.minimap });
      break;
  }
}

export function handleMouseDown({ pointer, scene }) {
  //logger.log('User interactions: handleMouseDown');

  let tile;

  if (!downDelay && scene.game.moode !== 'mininav') { // delay for 200ms for move event
    downDelay = _.delay(handleMouseDown, 60, { pointer, scene, noAutomatic: true })
    return;
  }

  switch (scene.game.mode) {
    case 'mininav':
      navigateMinimap({ pointer, scene: scene.minimap })
      handleGameMoving({ scene, pointer });
      break;
    case 'move':
      handleGameMoving({ scene, pointer });
      break;
    case 'select':
      tile = getTileForPointer({ pointer, scene });
      scene.game.selection.addSelected({ tiles: [tile], scene });
      break;
    case 'shiftdown':
      tile = getTileForPointer({ pointer, scene });
      scene.game.selection.removeSelected({ tile });
      break;
    case 'gameoflife':
      tile = getTileForPointer({ pointer, scene });
      tile.alive = true;

      // Enable some neighbors to make things more fun
      scene.tiles[tile.cy][tile.cx - 1].alive = true;
      scene.tiles[tile.cy][tile.cx + 1].alive = true;
      scene.tiles[tile.cy - 1][tile.cx].alive = true;
      scene.tiles[tile.cy + 1][tile.cx].alive = true;
      break;
  }

  if (downDelay) {
    clearTimeout(downDelay);
    downDelay = null;
  }
}

export async function handleMouseUp({ pointer, scene }) {
  logger.log('User interactions: handleMouseUp');

  if (scene.game.origDragPoint) {
    scene.game.origDragPoint = null;
    scene.game.moving = false;
  }

  if (scene.game.moveAutomatic) {
    setGameMode({ scene, mode: scene.game.moveAutomatic }) // reset to previos mode
    scene.game.moveAutomatic = null;
  }

  scene.game.selection.refreshSelection();
}

export function handleGameMoving({ scene, pointer }) {
  //logger.log('User interactions: handleGameMoving');

  if (pointer.isDown && !scene.game.moving) {
    scene.game.selection.clearBorders();

    if (scene.game.tools.infobox)
      scene.game.tools.clearInfoBox();

    scene.game.moving = true;

    // set new drag origin to current position
    scene.game.origDragPoint = pointer.position.clone();
  }
}

export function handleMouseWheel({ scene, dx, dy, dz }) {
  //logger.log('User interactions: Mouse wheel event');

  const newSize = (dy < 0) ? scene.size + 1 : scene.size - 1;

  if (newSize > 15 && newSize < 35) { // min, max zoom needs to be moved to config
    scene.size = newSize;
    scene.gridWidth = scene.appConfig.canvas.clientWidth / scene.size;
    scene.gridHeight = scene.appConfig.canvas.clientHeight / scene.size;

    scene.clearVisibleTiles();
    scene.createVisibleTiles();
  }
}

export function handleShiftDown({ scene }) {
  // logger.log('User interactions: handleShiftDown');

  if (scene.game.mode === 'select')
    setGameMode({ scene, mode: 'shiftdown' });

  scene.input.keyboard.off('keydown_SHIFT'); // Event repeats as longs as the button is pressed, we only want it to trigger once.
}

export function handleShiftUp({ scene }) {
  //logger.log('User interactions: handleShiftUp');

  if (scene.game.mode === 'shiftdown')
    setGameMode({ scene, mode: 'select' });

  scene.input.keyboard.on('keydown_SHIFT', (event) => {
    handleShiftDown({ scene });
  });
}

export function handleSpaceDown({ scene }) {
  //logger.log('User interactions: handleSpaceDown');

  if (scene.game.mode === 'select')
    setGameMode({ scene, mode: 'move' });

  scene.input.keyboard.off('keydown_SPACE'); // Event repeats as longs as the button is pressed, we only want it to trigger once.
}

export function handleSpaceUp({ scene }) {
  //logger.log('User interactions: handleSpaceUp');

  if (scene.game.mode === 'move')
    setGameMode({ scene, mode: 'select' });

  scene.input.keyboard.on('keydown_SPACE', (event) => {
    handleSpaceDown({ scene });
  });
}

export async function creditToken({ scene, value }) {
  logger.log('Action: creditToken', value);

  let txHash = null;

  scene.game.tools.setNotification(0, 'processing');
  pushGTMEvent('creditBtnClick', 'creditStart', scene);

  try {
    const gasPrice = await scene.game.web3.RPCProvider.getGasPrice();
    const gasLimit = await scene.game.web3.tokenContract.estimateGas.credit({
      from: scene.game.web3.activeAddress,
      value: ethers.utils.parseEther(value)
    });
    const finalGasLimit = ethers.BigNumber.from(parseInt(gasLimit.toNumber() * 1.2));
    const tx = await scene.game.web3.tokenContract.credit({
      from: scene.game.web3.activeAddress,
      value: ethers.utils.parseEther(value),
      gasPrice,
      gasLimit: finalGasLimit
    });

    txHash = tx.hash;
    scene.game.tools.setNotificationTxHash(txHash);

    await tx.wait();
  } catch (error) {
    logger.error('Action creditToken:', error);

    if (error) {
      if (error.code && error.code === 'ACTION_REJECTED') {
        scene.game.tools.removeNotification();
        return;
      }
    }

    pushGTMEvent('creditBtnClick', 'creditError', scene);
    scene.game.tools.setNotification(12000, 'error', txHash, 'Wallet RPC error, please try again.');
    return;
  }

  pushGTMEvent('creditBtnClick', 'creditSuccess', scene);
  scene.game.tools.setNotification(6500, 'success', txHash);
}

export async function permitToken({ scene, response, grant }) {
  logger.log('Action: permitToken');

  let txHash = null;

  scene.game.tools.setNotification(0, 'processing');
  pushGTMEvent('twitterBtnClick', 'permitStart', scene);

  try {
    const gasPrice = await scene.game.web3.RPCProvider.getGasPrice();
    const gasLimit = await scene.game.web3.tokenContract.estimateGas.grant(
      response.provider,
      scene.game.web3.activeAddress,
      response.value,
      response.deadline,
      grant,
      response.v,
      response.r,
      response.s,
      {
        from: scene.game.web3.activeAddress,
      }
    )
    const finalGasLimit = ethers.BigNumber.from(parseInt(gasLimit.toNumber() * 1.2));
    const tx = await scene.game.web3.tokenContract.grant(
      response.provider,
      scene.game.web3.activeAddress,
      response.value,
      response.deadline,
      grant,
      response.v,
      response.r,
      response.s,
      {
        from: scene.game.web3.activeAddress,
        gasPrice,
        gasLimit: finalGasLimit
      }
    )

    txHash = tx.hash;
    scene.game.tools.setNotificationTxHash(txHash);

    await tx.wait();
  } catch (error) {
    logger.error('Action permitToken:', error);

    if (error) {
      if (error.code && error.code === 'ACTION_REJECTED') {
        scene.game.tools.removeNotification();
        return;
      }
    }

    pushGTMEvent('twitterBtnClick', 'permitError', scene);
    scene.game.tools.setNotification(12000, 'error', txHash, 'Wallet RPC error, please try again.');
    return;
  }

  pushGTMEvent('twitterBtnClick', 'permitSuccess', scene);
  scene.game.tools.setNotification(6500, 'success', txHash);
  return true;
}

export async function permitSignature({ scene, token }) {
  let response;

  scene.game.tools.setNotification(0, 'signature');
  pushGTMEvent('twitterBtnClick', 'signatureStart', scene);

  try {
    const msgBody = ethers.utils.hashMessage("Collabs metamask message.");
    const signature = await scene.game.web3.signer.signMessage(msgBody);

    response = await fetch(config.api.permit, {
      method: 'POST',
      headers: {
        'signature': signature,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'twitter',
        category: 'login'
      })
    }).then((data) => data.json());
  } catch (error) {
    logger.error('Action permitSignature: ', error);

    if (error.message && error.message === 'MetaMask Message Signature: User denied message signature.') {
      scene.game.tools.removeNotification();
      return;
    }

    pushGTMEvent('twitterBtnClick', 'signatureError', scene);
    scene.game.tools.setNotification(10000, 'warning');
    return;
  }

  pushGTMEvent('twitterBtnClick', 'signatureSuccess', scene);
  scene.game.tools.removeNotification();
  return response;
}

export function navigateMinimap({ pointer, scene }) {
  //logger.log('User interactions: navigateMinimap');

  const margin = scene.sceneConfig.margin * 2; // we have to use double margin due to black border
  const fieldWidth = scene.fieldWidth * scene.sceneConfig.sizeRatio;
  const fieldHeight = scene.fieldHeight * scene.sceneConfig.sizeRatio;

  // Relative X,Y to the minimap
  const x = pointer.position.x - margin;
  const y = pointer.position.y - (scene.appConfig.canvas.clientHeight - (scene.sceneConfig.height + margin));

  // Actual X,Y based on the size ratio
  const cx = (x * scene.sceneConfig.sizeRatio) - (fieldWidth / 2);
  const cy = (y * scene.sceneConfig.sizeRatio) - (fieldHeight / 2);

  moveToPosition({ scene: scene.mainscene, x: cx, y: cy, save: true });
}

export function panDragMap({ pointer, scene }) {
  //logger.log('User interactions: panDragMap');

  const gridSize = scene.size / 8;

  if (scene.game.origDragPoint) {
    // move the camera by the amount the mouse has moved since last update
    let moveMomentumX = ((scene.game.origDragPoint.x - pointer.position.x) / gridSize);
    let moveMomentumY = ((scene.game.origDragPoint.y - pointer.position.y) / gridSize);

    let newX, newY;

    newX = scene.cameraX + moveMomentumX;
    newY = scene.cameraY + moveMomentumY;

    moveToPosition({ scene, x: newX, y: newY, save: true });
  }

  scene.game.origDragPoint = pointer.position.clone();
}

export function moveToPosition({ scene, x, y, save }) {
  //logger.log('User interactions: moveToPosition', x, y);

  scene.cameraX = x;
  scene.cameraY = y;

  const maxX = scene.pMax - scene.gridWidth;
  if (scene.cameraX === maxX || scene.cameraX > maxX)
    scene.cameraX = maxX;
  else if (scene.cameraX < 0)
    scene.cameraX = 0;

  const maxY = scene.pMax - scene.gridHeight;
  if (scene.cameraY === maxY || scene.cameraY > maxY)
    scene.cameraY = maxY;
  else if (scene.cameraY < 0)
    scene.cameraY = 0;

  scene.updateTiles();

  if (save)
    debounceSaveLastPosition(x, y); // Save last known position to localStorage
}

export function saveLastPosition(x, y) {
  //logger.log('saveLastPosition', x, y);

  try {
    localStorage.setItem('cx', x);
    localStorage.setItem('cy', y);
  } catch (error) {
    logger.error('Failed to save last known position', error);
  }
}

// Debounce save position -- https://stackoverflow.com/questions/23858046/debounce-function-with-args-underscore/23858092
// should be var for hoisting
var debounceSaveLastPosition = _.debounce(saveLastPosition, 500);

export function getLastPosition() {
  //logger.log('getLastPosition');

  let position = {
    x: 0,
    y: 0
  }

  try {
    const cx = localStorage.getItem('cx');
    const cy = localStorage.getItem('cy');

    if (cx)
      position.x = parseFloat(cx);

    if (cy)
      position.y = parseFloat(cy);
  } catch (error) {
    logger.error('Failed to get last known position', error);
  }

  return position;
}

// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {
  //logger.log('User interactions: positionSelectionBlock');

  if (scene.game.selection.highlight)
    scene.game.selection.repositionHighlight({ pointer, scene });
  else
    scene.game.selection.highlightTile({ pointer, scene });
}

// Set scene mode
export function setGameMode({ scene, mode }) {
  logger.log('User interactions: setGameMode', mode);

  switch (mode) {
    case 'move':
      scene.input.setDefaultCursor('grabbing');
      scene.game.mode = 'move';

      generalResetStrokeStyle({ scene, alpha: 0 });
      scene.game.selection.clearHighlight();
      break;
    case 'select':
      scene.input.setDefaultCursor('default');
      scene.game.mode = 'select';

      generalResetStrokeStyle({ scene, selection: true });
      break;
    case 'shiftdown':
      scene.input.setDefaultCursor('alias');
      scene.game.mode = 'shiftdown';

      generalResetStrokeStyle({ scene, selection: true });
      break;
    case 'mininav':
      scene.input.setDefaultCursor('crosshair');
      scene.game.mode = 'mininav';
      break;
    case 'gameoflife':
      scene.input.setDefaultCursor('default');
      scene.game.mode = 'gameoflife';

      generalResetStrokeStyle({ scene, selection: true });
      break;
    default:
      throw new Error('Trying to set unknown game mode: ' + mode);
  }
  //scene.game.emitter.emit('scene/mode', mode);
}

export function generalResetStrokeStyle({ scene, size, selection, alpha }) {
  //logger.log('generalStrokeReset', scene, size, alpha);

  for (let y = 0; y < scene.gridHeight; y++) {
    for (let x = 0; x < scene.gridWidth; x++) {
      const tile = scene.tiles[y][x];

      if (tile) {
        if (selection && scene.game.selection.isSelected(tile.cx, tile.cy))
          setInvertedStroke({ scene, tile });
        else
          resetStrokeStyle({ tile, scene, size, alpha });
      }
    }
  }
}

export function resetStrokeStyle({ tile, scene, size, alpha }) {
  // Reset stroke around the tile
  size = size || scene.strokeSize;
  alpha = alpha || (0.4 / window.devicePixelRatio).toFixed(2)

  if (tile) {
    tile.setStrokeStyle(size, scene.strokeColor.color, alpha);
    tile.setDepth(0);
  }
}

export function setInvertedStroke({ tile, scene }) {
  //logger.log('User interactions: setInvertedStroke');

  const invertedColor = invertColor(tile.fillColor, true);

  tile.setStrokeStyle(scene.strokeSize + (1 * window.devicePixelRatio), invertedColor.color, 0.8);
  tile.setDepth(10);
}

export function invertColor(fillColor, bw) {
  //logger.log('User interactions: invertColor');

  const color = Phaser.Display.Color.HexStringToColor('#' + formatColorNumber(fillColor));
  let { r, g, b } = color;

  if (bw) {
    const rgbaAverage = (r + g + b) / 3;

    if (rgbaAverage < 186) { // Black and white is also inverted, this is a bit weird
      r = 0;
      g = 0;
      b = 0;
    } else {
      r = 255;
      g = 255;
      b = 255;
    }
  }

  return Phaser.Display.Color.RGBStringToColor(`rgb(${255 - r}, ${255 - g}, ${255 - b})`); // Given r,g,b is inverted with 255-
}
