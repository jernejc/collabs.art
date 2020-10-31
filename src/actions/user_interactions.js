
// Fired when user moves pointer through the grid
export function handleMouseMove({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: handleMove');

  switch (scene.game.mode) {
    case 'move':
      if (pointer.isDown) {
        panDragMap({ pointer, scene });
      } else
        scene.game.origDragPoint = null;
      break;
    case 'select':
      //generalResetStrokeStyle({ scene });
      positionSelectionBlock({ pointer, scene });
      break;
    case 'drag':

      if (pointer.button === 2) // Ignore right click
        return;

      if (pointer.isDown && scene.game.selectionManager.rectangleSelection)
        scene.game.selectionManager.resizeRectangleSelection({ pointer, scene });

      break;
    case 'mininav':
      if (pointer.isDown)
        navigateMinimap({ pointer, scene: scene.minimap })
      break;
  }
}

export function handleMouseDown({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: handleMouseDown')

  switch (scene.game.mode) {
    case 'select':

      if (pointer.button === 2) { // Detect right click
        resetActiveSelection({ scene });
        return;
      }

      if (scene.game.selectionManager.rectangleSelection)
        scene.game.selectionManager.clearRectangleSelection();
      if (scene.game.selectionManager.singleSelection)
        scene.game.selectionManager.clearSingleSelection()

      scene.game.selectionManager.createSingleSelection({ pointer, scene })
      scene.game.selectionManager.displayInfoBox({ scene });
      break;
    case 'drag':

      if (pointer.button === 2) // Ignore right click
        return;

      scene.game.selectionManager.createRectangleSelection({ pointer, scene });
      break;
    case 'mininav':
      navigateMinimap({ pointer, scene: scene.minimap })
      break;
  }
}

export function handleMouseUp({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: handleMouseUp');

  if (scene.game.selectionManager.rectangleSelection)
    scene.game.selectionManager.displayInfoBox({ scene });
}

export function handleMouseWheel({ scene, dx, dy, dz }) {
  if (DEBUG) console.log('User interactions: Mouse wheel event');

  const newSize = (dy < 0) ? scene.size + 1 : scene.size - 1;

  if (newSize > 15 && newSize < 35) {
    scene.size = newSize;
    scene.gridWidth = scene.appConfig.canvasWidth / scene.size;
    scene.gridHeight = scene.appConfig.canvasHeight / scene.size;

    scene.clearVisiblePixel();
    scene.createVisiblePixels();
  }
}

export function handleShiftDown({ scene }) {
  if (DEBUG) console.log('User interactions: handleShiftDown');

  if (scene.game.mode === 'select')
    setGameMode({ scene, mode: 'drag' });

  scene.input.keyboard.off('keydown_SHIFT'); // Event repeats as longs as the button is pressed, we only want it to trigger once.
}

export function handleShiftUp({ scene }) {
  if (DEBUG) console.log('User interactions: handleShiftUp');

  if (scene.game.mode === 'drag')
    setGameMode({ scene, mode: 'select' });

  scene.input.keyboard.on('keydown_SHIFT', (event) => {
    handleShiftDown({ scene });
  });
}

export function handleSpaceDown({ scene }) {
  if (DEBUG) console.log('User interactions: handleSpaceDown');

  if (scene.game.mode === 'select')
    setGameMode({ scene, mode: 'move' });

  scene.input.keyboard.off('keydown_SPACE'); // Event repeats as longs as the button is pressed, we only want it to trigger once.
}

export function handleSpaceUp({ scene }) {
  if (DEBUG) console.log('User interactions: handleSpaceUp');

  if (scene.game.mode === 'move')
    setGameMode({ scene, mode: 'select' });

  scene.input.keyboard.on('keydown_SPACE', (event) => {
    handleSpaceDown({ scene });
  });
}

export function navigateMinimap({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: navigateMinimap');

  const newX = ((pointer.position.x * scene.sceneConfig.sizeRatio) - scene.sceneConfig.margin) -
    (scene.fieldWidth * scene.sceneConfig.sizeRatio);
  const newY = ((pointer.position.y - (scene.appConfig.canvasHeight - scene.sceneConfig.height)) *
    scene.sceneConfig.sizeRatio - scene.sceneConfig.margin) +
    ((scene.fieldHeight / 2) * scene.sceneConfig.sizeRatio);

  resetActiveSelection({ scene });
  moveToPosition({ scene: scene.mainscene, x: newX, y: newY });
}

export function panDragMap({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: panDragMap');

  if (scene.game.origDragPoint) {
    // move the camera by the amount the mouse has moved since last update
    const newX = scene.cameraX + (scene.game.origDragPoint.x - pointer.position.x);
    const newY = scene.cameraY + (scene.game.origDragPoint.y - pointer.position.y);

    moveToPosition({ scene, x: newX, y: newY });
  }

  // set new drag origin to current position
  scene.game.origDragPoint = pointer.position.clone();
  scene.updateLand();
}

export function moveToPosition({ scene, x, y }) {

  scene.cameraX = x;
  scene.cameraY = y;

  const maxX = scene.pMax - scene.gridWidth + 1;
  if (scene.cameraX === maxX || scene.cameraX > maxX)
    scene.cameraX = maxX;
  else if (scene.cameraX < 0)
    scene.cameraX = 0;

  const maxY = scene.pMax - scene.gridHeight + 1;
  if (scene.cameraY === maxY || scene.cameraY > maxY)
    scene.cameraY = maxY;
  else if (scene.cameraY < 0)
    scene.cameraY = 0;

  scene.updateLand();
}


// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {
  if (DEBUG) console.log('User interactions: positionSelectionBlock');

  if (scene.game.selectionManager.highlightSelection)
    scene.game.selectionManager.repositionHighlightSelection({ pointer, scene });
  else
    scene.game.selectionManager.createHighlightSelection({ pointer, scene });
}

// Set scene mode
export function setGameMode({ scene, mode }) {
  if (DEBUG) console.log('User interactions: setGameMode', mode);

  switch (mode) {
    case 'move':
      scene.input.setDefaultCursor('grabbing');
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
      scene.input.setDefaultCursor('cell');
      scene.game.mode = 'drag';

      resetActiveSelection({ scene });
      //generalResetStrokeStyle({ scene });
      break;
    case 'mininav':
      scene.input.setDefaultCursor('crosshair');
      scene.game.mode = 'mininav';
      break;
    default:
      throw new Error('Trying to set unknown game mode: ' + mode);
  }
  //scene.game.emitter.emit('scene/mode', mode);
}

export function resetActiveSelection({ scene }) {
  scene.game.selectionManager.reset();
}

export function generalResetStrokeStyle({ scene, size }) {
  if (DEBUG) console.log('generalStrokeReset', scene, size);

  for (let y = 0; y < scene.gridHeight; y++) {
    for (let x = 0; x < scene.gridWidth; x++) {
      const tile = scene.land[y][x];

      if (tile)
        resetStrokeStyle({ tile, scene, size });
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
  if (DEBUG) console.log('User interactions: invertColor');

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
