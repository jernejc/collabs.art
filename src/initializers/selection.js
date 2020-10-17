// Not yet implemented, but could come in handy.
import SelectionManager from '@util/selection_manager'

export function SelectionInitializer(game, emitter) {
  if (DEBUG) console.log('Selection Initializer', game, emitter);
  const manager = new SelectionManager(game);
  return manager;
}
