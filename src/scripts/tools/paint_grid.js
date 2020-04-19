import { AvailableColors, OtherColors } from '@scripts/util/colors'

export default function ({
  x,
  y,
  size,
  scene
}) {
  const bgColor = scene.game.appConfig.bgColor || OtherColors.FLOOR_COLOR
  const strokeColor = scene.game.appConfig.strokeColor || OtherColors.FLOOR_STROKE_COLOR
  const strokeSize = scene.game.appConfig.strokeSize || 0.5
  const strokeAlpha = 0.5
  const defaultDepth = 0

  let cellSquare = scene.add.rectangle(x, y, size, size, bgColor)
  cellSquare.setOrigin(0);
  cellSquare.setStrokeStyle(strokeSize, strokeColor, strokeAlpha)
  cellSquare.setDepth(defaultDepth)
  //console.log('cellSquare', cellSquare);
  //container.add(cellSquare)

  return cellSquare
}
