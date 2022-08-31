
import Pixel from '@models/pixel';

import Input from '@components/form/input';
import Button from '@components/form/button';
import ColorPicker from '@components/color/picker';
import LoadingBar from '@components/loading';

import { moveToPosition } from '@actions/general';
import { getRelativeTile, colorPixels } from '@actions/pixel';

import { insertAfter, formatColorNumber, colorToHexString } from '@util/helpers';
import logger from '@util/logger';

export default class Menu {
  constructor({ parent, game, activeTab }) {
    logger.log('Menu: constructor')

    this.parent = parent;
    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.lists = ['pixels', 'selection'];
    this.loaded = false;
    this.closed = false;

    if (activeTab && this.lists.includes(activeTab))
      this.activeTab = activeTab;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'menu-item');

    this.parent.append(this.domElement);

    this.clickHandlerBind = this.clickHandler.bind(this); // For easier removing of event listeners
  }

  async init() {

    // Create tabs header
    this.createTabs();
    this.domElement.addEventListener('click', this.clickHandlerBind);

    // Load initial pixels
    await this.loadPixels();
  }

  async clickHandler(e) {
    logger.log('Menu: clickhandler');

    /* Handle clicks:
      - Close Btn
      - Tab click
      - Settings click
      - Menu item click
      */

    if (e.target.classList.contains('close')) { // Handle close button
      this.close();
      return;
    }
    else if (e.target.classList.contains('tab')) { // Handle tab click
      this.switchToTab(e.target.dataset.list, e.target);
      return;
    }
    else if (e.target.classList.contains('settings')) {
      logger.log('Menu: settings btn click')
      return;
    } else {

      let target;

      target = (e.target.dataset.id) ? e.target : e.target.parentNode;

      if (target.dataset.cx && target.dataset.cy) {

        let cx, cy;

        cx = parseInt(target.dataset.cx);
        cy = parseInt(target.dataset.cy);

        const cameraX = parseInt(cx - (this.scene.gridWidth / 2));
        const cameraY = parseInt(cy - (this.scene.gridHeight / 2));

        //moveToPosition({ scene: this.scene, x: cameraX, y: cameraY });

        const tile = getRelativeTile({ cx, cy, scene: this.scene, color: true });
        await this.game.selection.addSelected({ tiles: [tile], scene: this.scene });
      }
    }

    return;
  }

  createTabs() {
    logger.log('Menu: createTabs');

    this.tabs = document.createElement('ul');
    this.tabs.classList.add('tabs');

    this.lists.forEach((list, l) => {
      const listItem = document.createElement('li');
      listItem.classList.add('tab');
      listItem.dataset.list = list;
      listItem.textContent = list;

      if (!this.activeTab && l === 0) {
        listItem.classList.add('active');
        this.activeTab = list;
      } else if (this.activeTab === list) {
        listItem.classList.add('active');
        this.activeTab = list;
      }

      this.tabs.append(listItem);

      if (l === this.lists.length - 1) {
        const closeBtn = document.createElement('i')
        closeBtn.classList.add('close', 'gg-close');
        this.tabs.append(closeBtn);
      }
    });

    this.domElement.append(this.tabs);
    this.createSettings();
  }

  createSettings() {
    logger.log('Menu: createSettings')

    if (!this.activeTab || !this.tabs)
      return;

    if (this.settings)
      this.resetSettings();

    this.settings = document.createElement('div');
    this.settings.classList.add('settings');

    switch (this.activeTab) {
      case 'pixels':
        this.settings.classList.add('filters');
        this.createFiltersSetting();
        break;
      case 'selection':
        this.settings.classList.add('batch');
        this.createBatchSetting();
        break;
    }

    insertAfter(this.settings, this.tabs);
  }

  createFiltersSetting() {
    const activeBids = document.createElement('div');
    activeBids.classList.add('setting');
    activeBids.innerHTML = '<i class="gg-sort-az"></i> Active bids';

    const pendingBids = document.createElement('div');
    pendingBids.classList.add('setting');
    pendingBids.innerHTML = '<i class="gg-sort-za"></i> Pending bids';

    this.settings.append(activeBids);
    this.settings.append(pendingBids);
  }

  createBatchSetting() {
    logger.log('Menu: createBatchSetting');

    const pixels = this.game.selection.pixels || null;

    if (!pixels || pixels.length === 0)
      return;

    const loading = pixels.filter(pixel => pixel.loadingGraph)

    if (loading.length > 0) {
      this.settings.append(new LoadingBar());
      return;
    }

    const lastPixel = pixels[pixels.length - 1],
    fullBid = pixels.reduce((aggregator, pixel) => {
        aggregator += pixel.bid;
        return aggregator;
      }, 0),
      batchSettings = {
        color: lastPixel.color || Phaser.Display.Color.HexStringToColor('#ffffff'),
        bid: fullBid
      }

    let batchCountElLabel = document.createElement('div');
        batchCountElLabel.classList.add('changes-stats')

    batchCountElLabel.innerHTML = `<span>${fullBid} $COLAB</span> ( ${pixels.length} modified )`;

    this.settings.append(batchCountElLabel);

    this.settings.batchApplyBtn = new Button({
      elClasses: ['action-button', 'action-settings'],
      text: 'Apply',
      //icon: 'gg-check-r',
      clickAction: async e => {
        console.log('batch apply clickAction');

        if (fullBid > this.game.web3.walletBalance) {
          this.game.tools.showTokenInfo();
          return;
        }

        await colorPixels({ scene: this.scene, selection: this.game.selection.pixels })
      }
    });

    this.settings.append(this.settings.batchApplyBtn.domElement);
  }

  close() {
    if (!this.domElement.classList.contains('closed'))
      this.domElement.classList.add('closed')

    this.closed = true;
    this.game.tools.updateActiveChangesCount();
  }

  open() {
    this.loadPixels();
    this.createSettings();

    if (this.domElement.classList.contains('closed'))
      this.domElement.classList.remove('closed')

    this.closed = false;
    this.game.tools.updateActiveChangesCount();
  }

  async loadPixels() {
    logger.log('Menu loadPixels');

    if (this.menuList)
      this.resetList();

    let pixels;

    switch (this.activeTab) {
      case 'pixels':
        //this.domElement.append(new LoadingBar());

        pixels = await this.game.graph.loadPixels({
          owner: this.game.web3.activeAddress
        });

        if (pixels && pixels.length > 0)
          pixels = pixels.map(data => {
            return Pixel.fromGraphData({ scene: this.scene, data })
          })
        break;
      case 'selection':
        pixels = this.game.selection.pixels;
        break;
    }

    this.createList(pixels);
  }

  /*refreshList() {
    logger.log('Menu: refreshList', this.game.selection.pixels);

    if (this.menuList)
      this.resetList();

    this.createList(this.game.selection.pixels);
  }*/

  createList(pixels) {
    this.menuList = document.createElement('ul');
    this.menuList.classList.add('list');
    this.domElement.append(this.menuList);

    pixels.forEach(pixel => this.menuList.append(this.listItemTemplate(pixel)));
    this.loaded = true;
  }

  resetSettings() {
    if (this.settings.batchCreateBtn)
      this.settings.batchCreateBtn.destroy();
    if (this.settings.batchApplyBtn)
      this.settings.batchApplyBtn.destroy();

    this.domElement.removeChild(this.settings);
    this.settings = null;
  }

  switchToTab(tab) {
    logger.log('Menu: switchToTab', tab);

    this.tabs.querySelector('.active').classList.remove('active');
    this.tabs.querySelector(`li[data-list="${tab}"]`).classList.add('active');

    this.activeTab = tab;
    this.createSettings();

    this.loadPixels();
  }

  listItemTemplate(pixel) {
    const item = document.createElement('li');

    item.dataset.id = pixel.position;
    item.dataset.cx = pixel.cx;
    item.dataset.cy = pixel.cy;

    if (pixel.originalColor) {
      item.innerHTML = `
        <span class="color" style="background: ${colorToHexString(pixel.originalColor)}"></span>
        <i class="gg-chevron-right"></i>
      `
    }

    item.innerHTML += `
      <span class="color" style="background: #${pixel.HEXcolor}"></span>
      <span class="text">${pixel.position}</span>
      <i class="gg-track location" />
    `;

    return item;
  }

  resetList() {
    this.domElement.removeChild(this.menuList);
    this.menuList = null;
  }

  destroy() {
    this.domElement.removeEventListener('click', this.clickHandlerBind);
    this.parent.removeChild(this.domElement);
    this.loaded = false;
  }
}