// Not yet implemented, but could come in handy.
import { displayInfoBox } from '@actions/user_interactions'
import SelectionManager from '@util/selection_manager'

export function SelectionInitializer(game, emitter) {
  console.log('SelectionInitializer', game, emitter);
  const manager = new SelectionManager(game);

  Emitter.on('scene/selectpixel', pixel => {
    console.log('scene/selectpixel', pixel)
    manager.add(pixel)
    displayInfoBox({ pixel, scene: game.scene.keys.MainScene })
  });

  Emitter.on('scene/deselectpixel', pixel => {
    console.log('scene/deselectpixel', pixel)
    manager.remove(pixel)
  });

  return manager
}
