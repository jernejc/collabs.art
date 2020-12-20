
import Web3 from 'web3';

import { stringToBN } from '@util/helpers';

export function createPixel({ x, y, scene }) {
  if (DEBUG) console.log('createPixel', x, y);

  const tx = scene.size * x;
  const ty = scene.size * y;
  //if (DEBUG) console.log('tx ty', tx, ty)

  const tile = scene.add.rectangle(tx, ty, scene.size, scene.size);
  tile.setDisplayOrigin(0, 0);

  //if (this.strokeSize > 0)
  //  tile.setStrokeStyle(this.strokeSize, this.strokeColor.color, 0.2);

  return tile;
}

export async function buyPixel({ scene, selection }) {
  if (DEBUG) console.log('BUY Pixel', selection);

  try {
    const defaultAccount = await scene.game.web3.getActiveAddress();

    await scene.game.web3.bidContract.methods.purchase(
      stringToBN(selection.position), // pixel position
      Web3.utils.stringToHex(selection.HEXcolor) // pixel color
    ).send({
      from: defaultAccount,
      gas: 300000,
      value: Web3.utils.toWei(selection.price, "ether")
    });
  } catch (error) {
    console.error('Purchase pixel error', error)
  }
}

export function colorPixel({ x, y, scene }) {
  if (DEBUG) console.log('COLOR Pixel', x, y)

  const mapPixel = getColor({ x, y, color: scene.color, scene });

  scene.land[y][x].cx = mapPixel.cx;
  scene.land[y][x].cy = mapPixel.cy;
  scene.land[y][x].id = `${mapPixel.cx}x${mapPixel.cy}`;
  scene.land[y][x].price = Math.random().toFixed(3);

  scene.land[y][x].setFillStyle(mapPixel.color.color);
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

export function getColor({ x, y, color, scene }) {
  if (DEBUG) console.log('getColor', x, y, color, scene);

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

export function getRelativePixel({ cx, cy, scene, color }) {

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

  if (color) {
    return {
      tile: tile,
      color: getColor({ x: rx, y: ry, scene })
    }
  } else
    return tile;
}

export function getPixelForPointer({ pointer, scene, color }) {
  const xPixel = parseInt(pointer.x / scene.size);
  const yPixel = parseInt(pointer.y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  if (color) {
    return {
      tile: tile,
      color: getColor({ x: xPixel, y: yPixel, scene })
    }
  } else
    return tile;
}

export function getPixelForXY({ x, y, scene, color }) {
  const xPixel = parseInt(x / scene.size);
  const yPixel = parseInt(y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  if (color) {
    return {
      tile: tile,
      color: getColor({ x: xPixel, y: yPixel, scene })
    };
  } else
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