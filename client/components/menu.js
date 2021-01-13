
import { formatPositionHex } from '@util/helpers';
import { moveToPosition } from '@actions/user_interactions';
import { getRelativeTile } from '@actions/pixel';
import Input from '@components/input';

import { hexToString, insertAfter, formatColorNumber } from '@util/helpers';

export default class Menu {
  constructor({ parent, game }) {
    this.parent = parent;
    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.lists = ['pixels', 'selection'];
    this.loaded = false;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'menu-item');

    this.parent.appendChild(this.domElement);
  }

  async init() {

    // Create tabs header
    this.createTabs();

    // Load initial pixels
    await this.loadPixels();

    this.domElement.addEventListener('click', e => this.clickHandler(e));
  }

  async clickHandler(e) {

    /* Handle clicks:
      - Close Btn
      - Tab click
      - Settings click
      - Menu item click
      */

    if (e.target.classList.contains('close')) { // Handle close button
      this.closeMenu();
      return;
    }
    else if (e.target.classList.contains('tab')) { // Handle tab click
      this.switchToTab(e.target.dataset.list, e.target);
      return;
    }
    else if (e.target.classList.contains('settings')) {
      console.log('settings btn click')
    }
    else {

      let target;

      target = (e.target.dataset.id) ? e.target : e.target.parentNode;

      if (target.dataset.cx && target.dataset.cy) {

        let cx, cy;

        cx = parseInt(target.dataset.cx);
        cy = parseInt(target.dataset.cy);

        const cameraX = parseInt(cx - (this.scene.gridWidth / 2));
        const cameraY = parseInt(cy - (this.scene.gridHeight / 2));

        moveToPosition({ scene: this.scene, x: cameraX, y: cameraY });

        /*console.log('clickHandler this.scene', this.scene)*/
        const tile = getRelativeTile({ cx, cy, scene: this.scene, color: true });
        await this.game.selection.setActiveTile({ tile, scene: this.scene });
      }
    }

    return;
  }

  createTabs() {
    this.tabs = document.createElement('ul');
    this.tabs.classList.add('tabs');

    this.lists.forEach((list, l) => {
      const listItem = document.createElement('li');
      listItem.classList.add('tab');
      listItem.dataset.list = list;
      listItem.textContent = list;

      if (l === 0) {
        listItem.classList.add('active');
        this.activeTab = list;
      }

      this.tabs.appendChild(listItem);

      if (l === this.lists.length - 1) {
        const closeBtn = document.createElement('i')
        closeBtn.classList.add('close', 'gg-close');
        this.tabs.appendChild(closeBtn);
      }
    });

    this.domElement.appendChild(this.tabs);
    this.createSettings();
  }

  createSettings() {
    if (!this.activeTab || !this.tabs)
      return;

    if (this.setting)
      this.resetSettings();

    this.setting = document.createElement('div');
    this.setting.classList.add('settings');

    switch (this.activeTab) {
      case 'pixels':
        this.setting.classList.add('filters');
        this.createFiltersSetting();
        break;
      case 'selection':
        this.setting.classList.add('batch');
        this.createBatchSetting();
        break;
    }

    insertAfter(this.setting, this.tabs);
  }

  createFiltersSetting() {
    const activeBids = document.createElement('span');
    activeBids.innerHTML = '<i class="gg-sort-az"></i> Active bids';

    const pendingBids = document.createElement('span');
    pendingBids.innerHTML = '<i class="gg-sort-za"></i> Pending bids';

    this.setting.appendChild(activeBids);
    this.setting.appendChild(pendingBids);
  }

  createBatchSetting() {
    const batch = document.createElement('div');

    console.log('createBatchSetting this.game.selection', this.game.selection);
    const activeTile = this.game.selection.activeTile || {};
    console.log('activeTile', activeTile);

    batch.appendChild(new Input(activeTile, 'color.color.color', {
      label: 'hex',
      width: '100%',
      scene: this.scene,
      type: 'color',
      border: true,
      elClasses: ['label-border-input'],
      format: (value) => '#' + formatColorNumber(value),
      validate: (value) => !isNaN(value) && value.length === 6,
      focus: () => {
        /*this.colorAdvancedUI.style.display = 'block';
        _self.setPosition();*/
      },
      blur: (e) => {
        //console.log('e', e);
        /*if (!preventClose) {
          this.colorAdvancedUI.style.display = 'none';
          _self.setPosition();
        }*/
      }
    }));

    batch.appendChild(new Input(activeTile, 'price', {
      //min: this.selection.price,
      max: 100,
      step: 0.001,
      type: 'number',
      label: 'ETH',
      width: '100%',
      border: true,
      elClasses: ['label-border-input'],
      scene: this.scene,
      format: (value) => (value) ? value.toFixed(3) : 0
    }));

    this.setting.appendChild(batch);
  }

  async loadPixels() {
    if (this.menuList)
      this.resetList();

    console.log('loadPixels', this.game.selection, this.activeTab);
    let pixels;

    switch (this.activeTab) {
      case 'pixels':
        pixels = await this.game.graph.loadPixels({
          owner: this.game.web3.activeAddress
        });
        break;
      case 'selection':
        pixels = [];
        break;
    }

    this.createList(pixels);
  }

  createList(pixels) {
    this.menuList = document.createElement('ul');
    this.menuList.classList.add('list');
    this.domElement.appendChild(this.menuList);

    pixels.forEach(pixel => this.menuList.appendChild(this.listItemTemplate(pixel)));
    this.loaded = true;
  }

  resetSettings() {
    this.domElement.removeChild(this.setting);
    this.setting = null;
  }

  switchToTab(tab, node) {
    console.log('switchToTab', tab);

    this.tabs.querySelector('.active').classList.remove('active');
    node.classList.add('active');

    this.activeTab = tab;
    this.createSettings();

    this.loadPixels();
  }

  listItemTemplate(data) {

    if (!data.color)
      data.color = 'FFFFFF';
    else
      data.color = hexToString(data.color);

    const position = formatPositionHex(data.id);

    const item = document.createElement('li');

    item.dataset.id = position.string;
    item.dataset.cx = position.x;
    item.dataset.cy = position.y;

    item.innerHTML = `
      <span class="color" style="background: #${data.color}"></span>
      <span class="text">${position.string}</span>
      <i class="gg-track location" />
    `;

    return item;
  }

  resetList() {
    this.domElement.removeChild(this.menuList);
    this.menuList = null;
  }

  closeMenu() {
    this.domElement.removeEventListener('click', this.clickHandler);
    this.domElement.removeChild(this.tabs);
    this.tabs = null;
    this.domElement.removeChild(this.menuList);
    this.menuList = null;
    this.parent.removeChild(this.domElement);
    this.loaded = false;
  }
}