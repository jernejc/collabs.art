
import Web3 from 'web3';

import { stringToBN } from '@util/helpers';

export async function buyPixel({ scene, selection }) {
  if (DEBUG) console.log('BUY Pixel', selection);

  let success = false;

  try {
    if (!scene.game.web3.activeAddress)
      await scene.game.web3.getActiveAddress();

    if (!scene.game.web3.activeAddress)
      return success;

    let price = selection.price;
    
    if (typeof price === 'number') 
      price = price.toString(); // web3.toWei needs strings or BN

    await scene.game.web3.bidContract.methods.purchase(
      stringToBN(selection.position), // pixel position
      Web3.utils.stringToHex(selection.HEXcolor) // pixel color
    ).send({
      from: scene.game.web3.activeAddress,
      gas: 300000,
      value: Web3.utils.toWei(price, "ether")
    });

    success = true;
  } catch (error) {
    console.error('Purchase pixel error', error);
  }

  return success;
}

export async function bidPixel({ scene, selection }) {
  if (DEBUG) console.log('BID Pixel', selection);

  let success = false;

  try {
    if (!scene.game.web3.activeAddress)
      await scene.game.web3.getActiveAddress();

    if (!scene.game.web3.activeAddress)
      return success;

    let price = selection.price;
    
    if (typeof price === 'number') 
      price = price.toString(); // web3.toWei needs strings or BN

    await scene.game.web3.bidContract.methods.placeBid(
      stringToBN(selection.position), // pixel position
      3600 * 7 // duration in seconds: 7h
    ).send({
      from: scene.game.web3.activeAddress,
      gas: 300000,
      value: Web3.utils.toWei(price, "ether")
    });

    success = true;
  } catch (error) {
    console.error('Purchase pixel error', error);
  }

  return success;
}

export async function setPixel({ selection, scene }) {
  if (DEBUG) console.log("SET pixel", selection.cx, selection.cy, selection.color, selection.HEXcolor);

  scene.worldmap.setPixel(
    selection.cx,
    selection.cy,
    selection.color.r,
    selection.color.g,
    selection.color.b
  )

  scene.worldmap.update();

  try {
    const defaultAccount = await scene.game.web3.getActiveAddress();
    await scene.game.web3.pixelContract.methods.setColor(
      stringToBN(selection.position), // pixel position
      Web3.utils.stringToHex(selection.HEXcolor) // pixel color
    ).send({
      from: defaultAccount,
      gas: 200000
    });
  } catch (error) {
    console.error('setColor pixel error', error)
  }

}

export function getColorForXY({ x, y, color, scene }) {
  if (DEBUG) console.log('getColorForXY', x, y, color, scene);

  color = color || new Phaser.Display.Color();

  const { cx, cy } = getRelativePosition({ x, y, scene });
  scene.worldmap.getPixel(cx, cy, color);
  //console.log('GET pixel', cx, cy, color.color);

  return { cx, cy, color };
}

export function getRelativePosition({ x, y, scene }) {
  const cx = parseInt(Phaser.Math.Wrap(scene.cameraX + x, 0, scene.imageWidth));
  const cy = parseInt(Phaser.Math.Wrap(scene.cameraY + y, 0, scene.imageHeight));

  return { cx, cy };
}

export function getRelativeTile({ cx, cy, scene }) {

  let rx, ry, tile;

  for (let y = 0; y < scene.gridHeight; y++) {
    for (let x = 0; x < scene.gridWidth; x++) {
      if (scene.land[y][x].cx === cx && scene.land[y][x].cy === cy) {
        tile = scene.land[y][x];
        rx = x;
        ry = y
      }
    }
  }

  return tile;
}

export function getTileForPointer({ pointer, scene }) {
  return getTileForXY({ x: pointer.x, y: pointer.y, scene })
}

export function getTileForXY({ x, y, scene }) {
  const xPixel = parseInt(x / scene.size);
  const yPixel = parseInt(y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  return tile;
}

/*resizePixel(x, y) {
  const oldSize = this.land[y][x].width;

  if (oldSize != getFullBoxWidth(this)) {
    this.land[y][x].width = getFullBoxWidth(this);
    this.land[y][x].height = getFullBoxWidth(this);

    this.land[y][x].x = x * getFullBoxWidth(this);
    this.land[y][x].y = y * getFullBoxWidth(this);

    this.land[y][x].setDepth(getFullBoxWidth(this));
  }

  return;

  function getFullBoxWidth(self) {
    return self.size + self.strokeSize;
  }
}*/