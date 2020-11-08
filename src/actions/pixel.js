
export function createPixel({ x, y, scene }) {
  //if (DEBUG) console.log('createPixel',x,y)
  const tx = scene.size * x;
  const ty = scene.size * y;
  //if (DEBUG) console.log('tx ty', tx, ty)

  const tile = scene.add.rectangle(tx, ty, scene.size, scene.size);
  tile.setDisplayOrigin(0, 0);

  //if (this.strokeSize > 0)
  //  tile.setStrokeStyle(this.strokeSize, this.strokeColor.color, 0.2);

  return tile;
}

export function colorPixel({ x, y, scene }) {
  /*if (DEBUG) console.log('colorPixel')*/
  const mapPixel = getColor({ x, y, color: scene.color, scene });
  const tile = scene.land[y][x];

  tile.cx = mapPixel.cx;
  tile.cy = mapPixel.cy;
  tile.id = `${mapPixel.cx}x${mapPixel.cy}`;
  tile.price = Math.random().toFixed(3);

  tile.setFillStyle(mapPixel.color.color);
}

export function setPixel({ pixel, scene }) {
  console.log("SET pixel", pixel.tile.cx, pixel.tile.cy, pixel.color.color.color);

  scene.worldmap.setPixel(
    pixel.tile.cx,
    pixel.tile.cy,
    pixel.color.color.r,
    pixel.color.color.g,
    pixel.color.color.b
  )

  scene.worldmap.update();
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