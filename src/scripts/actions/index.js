
import InfoBox from '../objects/info_box'

// Fired when user moves pointer through the grid
export function handleMove({ pointer, scene }) {
  //console.log('handleMove')

  if (pointer.isDown) {
    //console.log('pointer.isDown')
    handleClick({ pointer, scene })
  } else 
    scene.game.origDragPoint = null;

  // Reset existing selectors
  generalResetStrokeStyle(scene)

  if (scene.game.mode == 'select')
    positionSelectionBlock({ pointer, scene })

};

export function handleClick({ pointer, scene }) {
  switch (scene.game.mode) {
    case 'move':
      //console.log('handle move event')
      if (scene.game.origDragPoint) {
        // move the camera by the amount the mouse has moved since last update
        scene.cameraX += scene.game.origDragPoint.x - pointer.position.x;
        scene.cameraY += scene.game.origDragPoint.y - pointer.position.y;

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
      }

      // set new drag origin to current position
      scene.game.origDragPoint = pointer.position.clone();
      scene.updateLand();
      break;
    case 'select':
      clickPixel({ pointer, scene })
      break;
  }
}


export function clickPixel({ pointer, scene }) {
  const x = parseInt(pointer.x / scene.size);
  const y = parseInt(pointer.y / scene.size);

  const color = getColor({ x, y, scene })
  const tile = scene.land[y][x];

  if (scene.game.selectionManager.isSelected(tile))
    scene.game.emitter.emit('scene/deselectpixel', { tile, color });
  else
    scene.game.emitter.emit('scene/selectpixel', { tile, color });
}

export function createPixel({ x, y, scene }) {
  //console.log('createPixel',x,y)
  const tx = scene.size * x;
  const ty = scene.size * y;
  //console.log('tx ty', tx, ty)

  const tile = scene.add.rectangle(tx, ty, scene.size, scene.size);
  tile.setDisplayOrigin(0,0);
  
  //if (this.strokeSize > 0)
  //  tile.setStrokeStyle(this.strokeSize, this.strokeColor.color, 0.2);

  return tile;
}

export function colorPixel({ x, y, scene }) {
  //console.log('colorPixel')
  const mapPixel = getColor({ x, y, color: scene.color, scene });

  scene.land[y][x].cx = mapPixel.cx;
  scene.land[y][x].cy = mapPixel.cy;
  scene.land[y][x].id = `${mapPixel.cx}x${mapPixel.cy}`;

  scene.land[y][x].setFillStyle(mapPixel.color.color);
}

export function getColor({ x, y, color, scene }) {
  color = color || new Phaser.Display.Color();

  const cx = parseInt(Phaser.Math.Wrap(scene.cameraX + x, 0, scene.imageWidth));
  const cy = parseInt(Phaser.Math.Wrap(scene.cameraY + y, 0, scene.imageHeight));

  scene.worldmap.getPixel(cx, cy, color);

  return { cx, cy, color };
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

// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {

  const xPixel = parseInt(pointer.x / scene.size);
  const yPixel = parseInt(pointer.y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  if (tile) 
    setInvertedStroke(tile, scene) 
  
}

// Set scene mode
export function setGameMode({ scene, mode }) {
  switch (mode) {
    case 'move':
      scene.input.setDefaultCursor('grab')
      scene.game.mode = 'move';

      break;
    case 'select':
      scene.input.setDefaultCursor('default')
      scene.game.mode = 'select';

      break;
  }

  scene.game.emitter.emit('scene/mode', mode);
}

export function generalResetStrokeStyle(scene) {
  //console.log('generalStrokeReset', scene.game.selectionManager)
  for (let y = 0; y < scene.gridHeight; y++) {
    for (let x = 0; x < scene.gridWidth; x++) {
      const tile = scene.land[y][x];

      if (tile) {
        if(scene.game.selectionManager.isSelected(tile))
          setInvertedStroke(tile, scene) 
        else
          resetStrokeStyle(tile, scene)
      }
    }
  }
}

export function resetStrokeStyle(tile, scene) {
  // Reset stroke around the tile
  if (tile) {
    tile.setStrokeStyle(scene.strokeSize, scene.strokeColor.color, 0.9);
    tile.setDepth(0)
  }
}

export function setInvertedStroke(tile, scene) {
  const color = Phaser.Display.Color.HexStringToColor('#' + tile.fillColor.toString(16))
  const invertedColor = invertColor(color, true);

  tile.setStrokeStyle(scene.strokeSize + 1, invertedColor.color, 1);
  tile.setDepth(10);
}

export function invertColor(color, bw) {
  let { r,g,b } = color;

  if (bw) {
    const rgbaAverage = (r+g+b) / 3;

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
  
  return Phaser.Display.Color.RGBStringToColor(`rgb(${255-r}, ${255-g}, ${255-b})`); // Given r,g,b is inverted with 255-
}

export function displayInfoBox({ pixel, scene }) {
  const infoboxes = document.body.querySelectorAll('.info-box');
  const parent = document.body.querySelector('#game');

  // cleanup existing
  if (infoboxes.length > 0) 
    for (let index = 0; index < infoboxes.length; index++) 
      parent.removeChild(infoboxes[index]);

  // needs to handle multiple pixels..
  new InfoBox({ pixel, parent, scene })
}
