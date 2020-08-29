export function buildGridKey(x, y) {
  return `${x}x${y}`
}

export function calculateAxisPosition(pixelAxisAmount, gridSize) {
  return parseInt(pixelAxisAmount / gridSize) * gridSize
}

export function calculatePositionFromGrid(gridAmount, gridSize) {
  return gridAmount * gridSize
}