// Not yet implemented, but could come in handy.
import { ToolManager } from '@scripts/util/tool_manager'

export function ToolsInitializer (game) {
  const toolManager = new ToolManager(game);
  
  /*toolManager.add({
    name: 'PaintBlock',
    call: (options) => drawPaintBlock(options)
  })*/

  //let PaintBlock = toolManager.get('PaintBlock')

  return {
    //PaintBlock
  }
}
