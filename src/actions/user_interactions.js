
import { clickPixel, removeInfoBox } from '@actions/pixel'

// Fired when user moves pointer through the grid
export function handleMouseMove({ pointer, scene }) {
  //console.log('handleMove', pointer, scene);

  switch (scene.game.mode) {
    case 'move':
      if (pointer.isDown) {
        panDragMap({ pointer, scene });
      } else
        scene.game.origDragPoint = null;
      break;
    case 'select':
      generalResetStrokeStyle({ scene });
      positionSelectionBlock({ pointer, scene });
      break;
    case 'drag':

      if (pointer.button === 2) // Ignore right click
        return;

      if (pointer.isDown && scene.selectionRectangle) {
        scene.selectionRectangleEndPixel = getPixelForPointer({ pointer, scene });

        const W = scene.selectionRectangleEndPixel.x - scene.selectionRectangleBeginPixel.x;
        const H = scene.selectionRectangleEndPixel.y - scene.selectionRectangleBeginPixel.y;

        // Bug when changing rect size: https://phaser.discourse.group/t/how-to-resize-gameobjects-rectangle-without-changing-scale/4777
        scene.selectionRectangle.geom.setSize(W, H);
        scene.selectionRectangle.setSize(W, H);
        scene.selectionRectangle.updateData();
      }
      break;
  }
}

export function handleMouseDown({ pointer, scene }) {
  //console.log('handleMouseDown')

  switch (scene.game.mode) {
    case 'select':

      if (pointer.button === 2) { // Detect right click
        resetActiveSelection({ scene });
        generalResetStrokeStyle({ scene });
        return;
      }

      clickPixel({ pointer, scene });
      generalResetStrokeStyle({ scene });
      break;
    case 'drag':

      if (pointer.button === 2) // Ignore right click
        return;

      scene.selectionRectangleBeginPixel = getPixelForPointer({ pointer, scene });

      const X = scene.selectionRectangleBeginPixel.x;
      const Y = scene.selectionRectangleBeginPixel.y
      const W = pointer.x - scene.selectionRectangleBeginPixel.x;
      const H = pointer.y - scene.selectionRectangleBeginPixel.y;

      scene.selectionRectangle = scene.add.rectangle(X, Y, W, H);
      scene.selectionRectangle.setFillStyle(0xffffff, 0.15);
      scene.selectionRectangle.setStrokeStyle(1, 0xffffff, 0.9);
      scene.selectionRectangle.setDisplayOrigin(0, 0);

      console.log('scene.selectionRectangleBeginPixel', scene.selectionRectangleBeginPixel);
      console.log('scene.selectionRectangle', scene.selectionRectangle);
      break;
  }
}

export function handleMouseUp({ pointer, scene }) {
  //console.log('handleMouseUp', pointer, scene)

  if (scene.selectionRectangle) {
    scene.selectionRectangle.destroy();
    scene.selectionRectangle = null;
    scene.selectionRectangleBeginPixel = null;
    scene.selectionRectangleEndPixel = null;
  }
}

export function clearRectangleSelection({ scene }) {
  if (scene.selectionRectangle) {
    scene.selectionRectangle.destroy();
    scene.selectionRectangle = null;
    scene.selectionRectangleBeginPixel = null;
    scene.selectionRectangleEndPixel = null;
  }
}

export function handleShiftDown({ scene }) {
  if (scene.game.mode === 'select')
    setGameMode({ scene, mode: 'drag' });

  scene.input.keyboard.off('keydown_SHIFT') // Events repeats as longs as the button is pressed, we only want it to trigger once.
}

export function handleShiftUp({ scene }) {
  if (scene.game.mode === 'drag')
    setGameMode({ scene, mode: 'select' });

  scene.input.keyboard.on('keydown_SHIFT', (event) => {
    console.log('keydown_SHIFT event', event, scene.game.mode);
    handleShiftDown({ scene })
  })
}

export function panDragMap({ pointer, scene }) {

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
}

// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {

  const tile = getPixelForPointer({ pointer, scene })

  if (tile)
    setInvertedStroke({ tile, scene })

}

export function getPixelForPointer({ pointer, scene }) {
  const xPixel = parseInt(pointer.x / scene.size);
  const yPixel = parseInt(pointer.y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  return tile;
}

// Set scene mode
export function setGameMode({ scene, mode }) {
  console.log('setGameMode', mode)

  switch (mode) {
    case 'move':
      scene.input.setDefaultCursor('grab');
      scene.game.mode = 'move';

      resetActiveSelection({ scene });
      generalResetStrokeStyle({ scene, size: 0 });
      break;
    case 'select':
      scene.input.setDefaultCursor('default');
      scene.game.mode = 'select';

      generalResetStrokeStyle({ scene });
      break;
    case 'drag':
      scene.input.setDefaultCursor('copy');
      scene.game.mode = 'drag';

      resetActiveSelection({ scene });
      generalResetStrokeStyle({ scene });
      break;
  }
  //scene.game.emitter.emit('scene/mode', mode);
}

export function resetActiveSelection({ scene }) {
  removeInfoBox();
  scene.game.selectionManager.reset();
}

export function generalResetStrokeStyle({ scene, size }) {
  //console.log('generalStrokeReset', scene, size);

  for (let y = 0; y < scene.gridHeight; y++) {
    for (let x = 0; x < scene.gridWidth; x++) {
      const tile = scene.land[y][x];

      if (tile) {
        if (scene.game.selectionManager.isSelected(tile))
          setInvertedStroke({ tile, scene });
        else
          resetStrokeStyle({ tile, scene, size });
      }
    }
  }
}

export function resetStrokeStyle({ tile, scene, size = 0.9 }) {
  // Reset stroke around the tile
  if (tile) {
    tile.setStrokeStyle(scene.strokeSize, scene.strokeColor.color, size);
    tile.setDepth(0);
  }
}

export function setInvertedStroke({ tile, scene }) {
  const color = Phaser.Display.Color.HexStringToColor('#' + tile.fillColor.toString(16));
  const invertedColor = invertColor(color, true);

  tile.setStrokeStyle(scene.strokeSize + 1, invertedColor.color, 1);
  tile.setDepth(10);
}

export function invertColor(color, bw) {
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
