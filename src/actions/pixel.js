
import InfoBox from '@components/info_box'

export function clickPixel({ pointer, scene }) {
  const x = parseInt(pointer.x / scene.size);
  const y = parseInt(pointer.y / scene.size);

  const color = getColor({ x, y, scene })
  const tile = scene.land[y][x];

  // cleanup existing
  console.log('clickPixel scene.game', scene.game, scene.game.selectionManager.selection.length);

  if (scene.game.selectionManager.selection.length > 0)
    scene.game.selectionManager.reset();

  scene.game.selectionManager.add([{ tile, color }], scene);
}

export function createPixel({ x, y, scene }) {
  //console.log('createPixel',x,y)
  const tx = scene.size * x;
  const ty = scene.size * y;
  //console.log('tx ty', tx, ty)

  const tile = scene.add.rectangle(tx, ty, scene.size, scene.size);
  tile.setDisplayOrigin(0, 0);

  //if (this.strokeSize > 0)
  //  tile.setStrokeStyle(this.strokeSize, this.strokeColor.color, 0.2);

  return tile;
}

export function colorPixel({ x, y, scene }) {
  //console.log('colorPixel')
  const mapPixel = getColor({ x, y, color: scene.color, scene });
  const tile = scene.land[y][x];

  tile.cx = mapPixel.cx;
  tile.cy = mapPixel.cy;
  tile.id = `${mapPixel.cx}x${mapPixel.cy}`;

  tile.setFillStyle(mapPixel.color.color);

  tile.price = Math.random().toFixed(3);
  tile.buyoption = 'buy';
}

export function getColor({ x, y, color, scene }) {
  color = color || new Phaser.Display.Color();

  const { cx, cy } = getRelativePosition({ x, y, scene });
  scene.worldmap.getPixel(cx, cy, color);

  return { cx, cy, color };
}

export function getRelativePosition({ x, y, scene }) {
  const cx = parseInt(Phaser.Math.Wrap(scene.cameraX + x, 0, scene.imageWidth));
  const cy = parseInt(Phaser.Math.Wrap(scene.cameraY + y, 0, scene.imageHeight));

  return { cx, cy }
}

export function displayInfoBox({ pixels, scene }) {
  const parent = document.body.querySelector('#game');

  // needs to handle multiple pixels..
  return new InfoBox({ pixels, parent, scene });
}

export function getPixelForPointer({ pointer, scene }) {
  const xPixel = parseInt(pointer.x / scene.size);
  const yPixel = parseInt(pointer.y / scene.size);

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