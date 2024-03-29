import { toWei, stringToBN, stringToHex, pushGTMEvent } from '@util/helpers';
import logger from '@util/logger';
import { ethers } from 'ethers';

export function getColorForXY({ x, y, color, scene }) {
  //logger.log('getColorForXY', x, y, color, scene);

  color = color || new Phaser.Display.Color();

  const { cx, cy } = getRelativePosition({ x, y, scene });
  scene.worldmap.getPixel(cx, cy, color);

  return { cx, cy, color };
}

export function getRelativePosition({ x, y, scene }) {
  const cx = parseInt(Phaser.Math.Wrap(scene.cameraX + x, 0, scene.imageWidth));
  const cy = parseInt(Phaser.Math.Wrap(scene.cameraY + y, 0, scene.imageHeight));

  return { cx, cy };
}

export function getRelativeTile({ cx, cy, scene }) {

  let tile;

  for (let y = 0; y < scene.gridHeight; y++)
    for (let x = 0; x < scene.gridWidth; x++)
      if (scene.tiles[y][x].cx === cx && scene.tiles[y][x].cy === cy)
        tile = scene.tiles[y][x];

  return tile;
}

export function getTileForPointer({ pointer, scene }) {
  return getTileForXY({ x: pointer.x, y: pointer.y, scene })
}

export function getTileForXY({ x, y, scene }) {
  const xPixel = parseInt(x / scene.size);
  const yPixel = parseInt(y / scene.size);

  let tile;

  if (scene.tiles[yPixel])
    tile = scene.tiles[yPixel][xPixel];

  return tile;
}

export async function loadPixel({ scene, position }) {
  logger.log('Action loadPixel', position);

  try {
    await scene.game.web3.canvasContract.methods.getPixel(stringToBN(position)).call();
  } catch (error) {
    logger.error('Action loadPixel: ', error);
    return;
  }
}

export async function colorPixels({ scene, selection }) {
  logger.log('Action colorPixels')

  scene.game.tools.setNotification(0, 'processing');

  let positions = [], colors = [], bids = [];

  selection.forEach(pixel => {
    positions.push(stringToBN(pixel.position));
    colors.push(stringToHex(pixel.HEXcolor));
    bids.push(toWei(pixel.bid.toString()).toString());
  });

  let txHash;

  try {
    const gasPrice = await scene.game.web3.RPCProvider.getGasPrice();
    const gasLimit = await scene.game.web3.canvasContract.estimateGas.setColors(
      positions,
      colors,
      bids,
      {
        from: scene.game.web3.activeAddress
      }
    )
    const finalGasLimit = ethers.BigNumber.from(parseInt(gasLimit.toNumber() * 1.5));
    const tx = await scene.game.web3.canvasContract.setColors(
      positions,
      colors,
      bids,
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
    logger.error('Action colorPixels:', error);

    if (error.code && (error.code === 'ACTION_REJECTED' || error.code === 'UNPREDICTABLE_GAS_LIMIT')) {
      scene.game.tools.removeNotification();
      return;
    }

    if (error.data && error.data.message && error.data.message.includes('insufficient funds')) {
      scene.game.tools.setNotification(10000, 'info', null, 'Insufficient funds.');
      return;
    }

    pushGTMEvent('bottomNavApplyBtn', 'colorPixelError', scene);
    scene.game.tools.setNotification(12000, 'error', txHash, 'Wallet RPC error, please try again.');
    return;
  }

  updateWorldImagePixelColors({ pixels: selection, scene });

  pushGTMEvent('bottomNavApplyBtn', 'colorPixelSuccess', scene);
  scene.game.selection.clearAllSelection();
  scene.game.tools.setNotification(6500, 'success', txHash);
}

export function updateWorldImagePixelColors({ pixels, scene, updateTile }) {
  logger.log('updateWorldImagePixelColors');

  pixels.forEach(pixel => {
    scene.worldmap.setPixel(
      pixel.cx,
      pixel.cy,
      pixel.color.r,
      pixel.color.g,
      pixel.color.b
    )

    if (pixel.originalColor)
      pixel.originalColor = null;

    const tile = getRelativeTile({ cx: pixel.cx, cy: pixel.cy, scene });

    if (tile)
      tile.setFillStyle(pixel.color.color);
  });

  scene.worldmap.update();
}

/*resizePixel(x, y) {
  const oldSize = this.tiles[y][x].width;

  if (oldSize != getFullBoxWidth(this)) {
    this.tiles[y][x].width = getFullBoxWidth(this);
    this.tiles[y][x].height = getFullBoxWidth(this);

    this.tiles[y][x].x = x * getFullBoxWidth(this);
    this.tiles[y][x].y = y * getFullBoxWidth(this);

    this.tiles[y][x].setDepth(getFullBoxWidth(this));
  }

  return;

  function getFullBoxWidth(self) {
    return self.size + self.strokeSize;
  }
}*/