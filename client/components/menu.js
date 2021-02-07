
import Pixel from '@models/pixel';

import Input from '@components/input';
import Button from '@components/button';

import { moveToPosition, purchasePixels } from '@actions/user_interactions';
import { getRelativeTile } from '@actions/pixel';

import { insertAfter, formatColorNumber } from '@util/helpers';
import { relative } from 'path';

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
      this.close();
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
        await this.game.selection.setActivePixel({ tile, scene: this.scene });
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
        console.log('Found default activeTab value')
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
    console.log('createSettings', this.activeTab)
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

    this.settings.appendChild(activeBids);
    this.settings.appendChild(pendingBids);
  }

  createBatchSetting() {
    /*if (DEBUG)*/ console.log('createBatchSetting this.game.selection', this.game.selection.pixels);

    const pixels = this.game.selection.pixels || null;
    const lastPixel = pixels[pixels.length - 1];
    const fullPrice = pixels.reduce((aggregator, pixel) => {
      aggregator += Number(pixel.price);
      return aggregator;
    }, 0);

    if (lastPixel) {
      console.log('lastPixel', lastPixel);

      if (!lastPixel.owner)
        this.settings.classList.add('purchaseUI');
      else if (lastPixel.owner === this.game.web3.activeAddress) 
        this.settings.classList.add('activeBidUI');
      else
        this.settings.classList.add('bidUI');
      
    }

    const batchSettings = {
      color: lastPixel.color || Phaser.Display.Color.HexStringToColor('#ffffff'),
      price: fullPrice
    }

    console.log('batchSettings', batchSettings);

    /*this.settings.appendChild(new Input(batchSettings, 'color.color', {
      width: '35%',
      scene: this.scene,
      type: 'color',
      elClasses: ['setting'],
      format: (value) => '#' + formatColorNumber(value),
      validate: (value) => !isNaN(value) && value.length === 6,
      focus: () => {
        this.colorAdvancedUI.style.display = 'block';
        _self.setPosition();
      },
      blur: (e) => {
        //console.log('e', e);
        if (!preventClose) {
          this.colorAdvancedUI.style.display = 'none';
          _self.setPosition();
        }
      }
    }));*/

    const textIcon = document.createElement('i');
    textIcon.classList.add('gg-info');

    this.settings.appendChild(textIcon);
    this.settings.appendChild(new Input(batchSettings, 'price', {
      width: '30%',
      elClasses: ['setting'],
      type: 'text',
      scene: this.scene,
      label: 'ETH',
      disabled: true,
      format: (value) => (value) ? value.toFixed(3) : 0
    }));

    this.settings.appendChild(new Button({
      elClasses: ['action-button', 'action-settings'],
      text: 'Create',
      clickAction: async e => {
        await purchasePixels({ scene: this.scene, selection: this.game.selection.pixels })
      }
    }));
  }

  async loadPixels() {
    if (DEBUG) console.log('Menu loadPixels', this.game.selection, this.activeTab);

    if (this.menuList)
      this.resetList();

    let pixels;

    switch (this.activeTab) {
      case 'pixels':
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
    this.domElement.appendChild(this.menuList);

    pixels.forEach(pixel => this.menuList.appendChild(this.listItemTemplate(pixel)));
    this.loaded = true;
  }

  resetSettings() {
    this.domElement.removeChild(this.settings);
    this.settings = null;
  }

  switchToTab(tab) {
    console.log('switchToTab', tab);

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

  close() {
    this.domElement.removeEventListener('click', this.clickHandler);
    this.domElement.removeChild(this.tabs);
    this.tabs = null;
    this.domElement.removeChild(this.menuList);
    this.menuList = null;
    this.parent.removeChild(this.domElement);
    this.loaded = false;
  }
}