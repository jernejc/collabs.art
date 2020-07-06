

// Fired when user moves pointer through the grid
export function handleMove({ pointer, scene }) {
  //console.log('handleMove')

  if (scene.game.mode == 'select')
    positionSelectionBlock({ pointer, scene })

  if (pointer.isDown) {
    //console.log('pointer.isDown')
    handleClick({ pointer, scene })
  } else 
    scene.game.origDragPoint = null;

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
      selectPixel({ pointer, scene })
      break;
  }
}


export function selectPixel({ pointer, scene }) {
  const x = parseInt(pointer.x / scene.size);
  const y = parseInt(pointer.y / scene.size);

  const color = scene.getColor(x,y)
  const tile = scene.land[y][x];

  console.log('selectPixel', x, y, color.color, tile)
}

// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {

  // Reset existing selectors
  generalResetStrokeStyle(scene)

  const xPixel = parseInt(pointer.x / scene.size);
  const yPixel = parseInt(pointer.y / scene.size);

  let tile;

  if (scene.land[yPixel])
    tile = scene.land[yPixel][xPixel];

  if (tile) {
    const invertedColor = invertColor(tile.fillColor.toString());
    const brightBorder = Phaser.Display.Color.HexStringToColor(invertedColor);

    tile.setStrokeStyle(scene.strokeSize + 1, brightBorder.color, 1);
    tile.setDepth(10);
  }
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
  for (let y = 0; y < scene.gridHeight; y++) 
    for (let x = 0; x < scene.gridWidth; x++) 
      resetStrokeStyle(scene.land[y][x], scene)
}

export function resetStrokeStyle(tile, scene) {
  // Reset stroke around the tile
  if (tile) {
    tile.setStrokeStyle(scene.strokeSize, scene.strokeColor.color, 0.2);
    tile.setDepth(1)
  }
}

export function invertColor(hex) {
  if (hex.indexOf('#') === 0)
    hex = hex.slice(1);

  return (Number(`0x${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}
