
import InfoBox from '@components/info_box'

export function clickPixel({ pointer, scene }) {
  const x = parseInt(pointer.x / scene.size);
  const y = parseInt(pointer.y / scene.size);

  const color = getColor({ x, y, scene })
  const tile = scene.land[y][x];

  /*if (scene.game.selectionManager.isSelected(tile))
    scene.game.emitter.emit('scene/deselectpixel', { tile, color });
  else*/

  //scene.game.emitter.emit('scene/selectpixel', { tile, color });

  scene.game.selectionManager.add({ tile, color }, scene);
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

  const cx = parseInt(Phaser.Math.Wrap(scene.cameraX + x, 0, scene.imageWidth));
  const cy = parseInt(Phaser.Math.Wrap(scene.cameraY + y, 0, scene.imageHeight));

  scene.worldmap.getPixel(cx, cy, color);

  return { cx, cy, color };
}

export function displayInfoBox({ pixel, scene }) {
  const infoboxes = document.body.querySelectorAll('.info-box');
  const parent = document.body.querySelector('#game');

  // cleanup existing
  if (infoboxes.length > 0)
    for (let index = 0; index < infoboxes.length; index++)
      parent.removeChild(infoboxes[index]);

  // needs to handle multiple pixels..
  return new InfoBox({ pixel, parent, scene });
}

export function removeInfoBox() {
  const infoboxes = document.body.querySelectorAll('.info-box');
  const parent = document.body.querySelector('#game');

  // cleanup existing
  if (infoboxes.length > 0)
    for (let index = 0; index < infoboxes.length; index++)
      parent.removeChild(infoboxes[index]);

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