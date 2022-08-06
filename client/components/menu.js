
import Pixel from '@models/pixel';

import Input from '@components/form/input';
import Button from '@components/form/button';
import ColorPicker from '@components/color/picker';
import LoadingBar from '@components/loading';

import { moveToPosition } from '@actions/general';
import { getRelativeTile, purchasePixels, colorPixels } from '@actions/pixel';

import { insertAfter, formatColorNumber } from '@util/helpers';

export default class Menu {
  constructor({ parent, game, activeTab }) {
    if (DEBUG) console.log('Menu: constructor', parent, game, activeTab)

    this.parent = parent;
    this.game = game;
    this.scene = game.scene.keys['MainScene'];
    this.lists = ['pixels', 'selection'];
    this.loaded = false;

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
    if (DEBUG) console.log('Menu: clickhandler', e);

    /* Handle clicks:
      - Close Btn
      - Tab click
      - Settings click
      - Menu item click
      */

    if (e.target.classList.contains('close')) { // Handle close button
      this.game.selection.clearActiveSelection();
      return;
    }
    else if (e.target.classList.contains('tab')) { // Handle tab click
      this.switchToTab(e.target.dataset.list, e.target);
      return;
    }
    else if (e.target.classList.contains('settings'))
      console.log('settings btn click')
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
        await this.game.selection.addSelected({ tiles: [tile], scene: this.scene });
      }
    }

    return;
  }

  createTabs() {
    if (DEBUG) console.log('createTabs', this.activeTab);

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
    if (DEBUG) console.log('createSettings', this.activeTab)

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
    if (DEBUG) console.log('createBatchSetting');

    const _self = this;
    const pixels = this.game.selection.pixels || null;

    if (!pixels || pixels.length === 0)
      return;

    const loading = pixels.filter(pixel => pixel.loadingGraph)

    if (loading.length > 0) {
      this.settings.append(new LoadingBar());
      return;
    }

    const lastPixel = pixels[pixels.length - 1],
      fullPrice = pixels.reduce((aggregator, pixel) => {
        aggregator += Number(pixel.price);
        return aggregator;
      }, 0),
      batchSettings = {
        color: lastPixel.color || Phaser.Display.Color.HexStringToColor('#ffffff'),
        price: fullPrice
      }

    let batchUI = 'bidUI',
      relevantPixels = [],
      batchCountEl = document.createElement('input'),
      batchCountElLabel = document.createElement('label');

    batchCountEl.type = 'checkbox';
    batchCountEl.disabled = true;
    batchCountEl.checked = true;

    if (!lastPixel.owner)
      batchUI = 'purchaseUI';
    else if (lastPixel.owner === this.game.web3.activeAddress)
      batchUI = 'ownerUI';

    this.settings.classList.add(batchUI);

    const textIcon = document.createElement('i');
    textIcon.classList.add('gg-info');
    this.settings.append(textIcon);

    switch (batchUI) {
      case 'purchaseUI':
        relevantPixels = pixels.filter(pixel => !pixel.owner);

        this.settings.append(new Input(batchSettings, 'price', {
          elClasses: ['setting'],
          type: 'text',
          scene: this.scene,
          label: this.game.web3.currentSymbol,
          disabled: true,
          format: (value) => (value) ? value.toFixed(3) : 0
        }));

        this.settings.batchCreateBtn = new Button({
          elClasses: ['action-button', 'action-settings'],
          text: 'Mint',
          clickAction: async e => {
            await purchasePixels({ scene: this.scene, selection: relevantPixels })
          }
        });
        this.settings.append(this.settings.batchCreateBtn.domElement);

        break;
      case 'ownerUI':
        relevantPixels = pixels.filter(pixel => pixel.owner === this.game.web3.activeAddress);

        this.settings.colorPicker = new ColorPicker(batchSettings, 'color', {
          scene: this.scene,
          type: 'color',
          //label: 'Color',
          elClasses: ['setting'],
          format: (value) => '#' + formatColorNumber(value),
          validate: (value) => !isNaN(value) && value.length === 6,
          update: (value) => {
            relevantPixels.forEach(pixel => pixel.changeToColorNumber(value))

            if (_self.settings.batchApplyBtn)
              _self.settings.batchApplyBtn.domElement.disabled = false;
          }
        });
        this.settings.append(this.settings.colorPicker.domElement);

        this.settings.batchApplyBtn = new Button({
          elClasses: ['action-button', 'action-settings'],
          text: 'Apply',
          disabled: true,
          clickAction: async e => {
            await colorPixels({ scene: this.scene, selection: this.game.selection.pixels })
          }
        });
        this.settings.append(this.settings.batchApplyBtn.domElement);

        break;
    }

    if (DEBUG) console.log('Menu: relevantPixels', relevantPixels)
    batchCountElLabel.textContent = relevantPixels.length;

    this.settings.append(batchCountElLabel);
    this.settings.append(batchCountEl);
  }

  async loadPixels() {
    if (DEBUG) console.log('Menu loadPixels', this.game.selection, this.activeTab);

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
    if (DEBUG) console.log('switchToTab', tab);

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

    item.innerHTML = `
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