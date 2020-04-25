import drawPaintGrid from '@scripts/tools/paint_grid'
import drawSelectionBlock from '@scripts/tools/selection_block'
import drawPaintBlock from '@scripts/tools/paint_block'
import { calculateAxisPosition } from '@scripts/util/helpers'
import { AvailableColors } from '@scripts/util/colors'

export function clickTool({ pointer }) {
  let scene = pointer.manager.game.scene.scenes[0]
  let x = parseInt(pointer.x / scene.game.appConfig.gridSize) * scene.game.appConfig.gridSize
  let y = parseInt(pointer.y / scene.game.appConfig.gridSize) * scene.game.appConfig.gridSize

  scene.game.paintMode({
    bgColor: scene.game.appConfig.selectedColor,
    strokeColor: AvailableColors.WALL_COLOR,
    x,
    y,
    size: scene.game.appConfig.gridSize,
    scene: scene
  })
}

// Fired when user moves pointer through the grid
export function dragTool({ pointer, scene }) {
  //console.log('dragTool')

  if (scene.game.mode == 'select')
    positionSelectionBlock({ pointer, scene })

  if (pointer.isDown) {
    //console.log('pointer.isDown')
    switch (scene.game.mode) {
      case 'move':
        //console.log('handle move dragTool event')
        if (scene.game.origDragPoint) {
          // move the camera by the amount the mouse has moved since last update
          scene.px += scene.game.origDragPoint.x - pointer.position.x;
          scene.py += scene.game.origDragPoint.y - pointer.position.y;

          if (scene.px === scene.pMax || scene.px > scene.pMax) 
            scene.px === scene.pMax
          else if (scene.px < 0) 
            scene.px = 0;
          
          if (scene.py === scene.pMax || scene.py > scene.pMax)
            scene.py = scene.imageHeight;  
          else if (scene.py < 0) 
            scene.py = 0;

        } 
        
        // set new drag origin to current position
        scene.game.origDragPoint = pointer.position.clone();
        scene.updateLand();
      break;
      case 'select':
        console.log('handle select dragTool event')
        clickTool({ pointer })
      break;
    }
  } else {
    scene.game.origDragPoint = null;
  }
};

// Set the Position of the Selection Block
export function positionSelectionBlock({ pointer, scene }) {
  console.log('positionSelectionBlock')
  scene.selectionRect.x = pointer.x
  scene.selectionRect.y = pointer.y
}

// Create the Selection Block
export function createSelectionBlock({ pointer, scene }) {
  console.log('createSelectionBlock')
  return drawSelectionBlock({
    size: scene.game.appConfig.gridSize,
    x: pointer.x,
    y: pointer.y,
    scene
  })
}

// Create Grid Blocks
export function createGridBlocks({ scene, container }) {
  let gridBlocks = []
  for (let i = 0; i < scene.game.appConfig.totalGridX; i++) {
    for (let j = 0; j < scene.game.appConfig.totalGridY; j++) {
      gridBlocks.push(
        drawPaintGrid({
          x: i * scene.game.appConfig.gridSize,
          y: j * scene.game.appConfig.gridSize,
          size: scene.game.appConfig.gridSize,
          scene: scene,
          container
        })
      )
    }
  }
  return gridBlocks
}

// Set scene mode
export function setGameMode({ scene, mode }) {
  switch (mode) {
    case 'move':
      scene.input.setDefaultCursor('grab')
      scene.game.mode = 'move';
      scene.game.paintMode = null

      if (scene.selectionRect) {
        scene.selectionRect.destroy()
        scene.selectionRect = null
      }
      break;
    case 'select':
      scene.input.setDefaultCursor('default')
      scene.game.paintMode = drawPaintBlock
      scene.game.mode = 'select';

      scene.selectionRect = createSelectionBlock({ pointer: scene.input.activePointer, scene })
      break;
  }
}
