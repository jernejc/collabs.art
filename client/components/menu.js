
import { formatPositionHex } from '@util/helpers';
import { moveToPosition } from '@actions/user_interactions';
import { getRelativePixel } from '@actions/pixel';

export default class Menu {
  constructor({ parent, game }) {
    this.parent = parent;
    this.game = game;
    this.scene = game.scene.keys['MainScene'];

    console.log('Menu comp scene', this.scene)

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'menu-item');

    this.parent.appendChild(this.domElement);
  }

  async init() {
    const pixels = await this.game.graph.loadPixels();
    this.createList(pixels);

    this.domElement.addEventListener('click', async (e) => {
      let cx, cy, target;

      target = (e.target.dataset.id) ? e.target : e.target.parentNode;

      cx = parseInt(target.dataset.x);
      cy = parseInt(target.dataset.y);

      const cameraX = parseInt(cx - (this.scene.gridWidth / 2));
      const cameraY = parseInt(cy - (this.scene.gridHeight / 2));

      moveToPosition({ scene: this.scene, x: cameraX, y: cameraY });

      const pixel = getRelativePixel({ cx, cy, scene: this.scene, color: true });
      await this.game.selection.createSingleSelection({ pixel, scene: this.scene });
    });
  }

  createList(pixels) {
    this.menuList = document.createElement('ul');
    this.domElement.appendChild(this.menuList);

    pixels.forEach(pixel => {
      const item = this.listItemTemplate(pixel);
      this.menuList.appendChild(item);
    });
  }

  listItemTemplate(data) {
    
    if (!data.color)
      data.color = '#FFFFFF';

    const position = formatPositionHex(data.id);
    console.log('position', position);

    const item = document.createElement('li');

    item.dataset.id = position.string;
    item.dataset.x = position.x;
    item.dataset.y = position.y;

    item.innerHTML = `
      <span class="color" style="background: ${data.color}"></span>
      <span class="text">${position.string}</span>
      <i class="gg-track location" />
    `;

    return item;
  }
}