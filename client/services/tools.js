
import config from '@util/config';

import MinimapScene from '@scenes/minimap';

import InfoBox from '@components/infobox';
import Menu from '@components/menu';

import Button from '@components/form/button';
import Input from '@components/form/input';

export default class ToolsManager {

  constructor(game, emitter) {
    if (DEBUG) console.log('ToolsManager: constructor');

    this.game = game;
    this.emitter = emitter;

    //this.gameCanvas = document.querySelector('#' + game.appConfig.canvasElement);
    console.log('this.game', this.game);
    this.parent = this.game.canvas.parentNode;
    this.infobox = null;
    this.search = {
      text: ''
    }

    this.addHeader();
    this.addConnectionStatus();
    this.addNetworkAlert();
    this.addBottomNav();
    this.addEventListeners();
  }

  addEventListeners() {
    this.emitter.on('web3/network', async network => {
      /*if (DEBUG)*/ console.log('ToolsManager: on web3/network');

      this.setConnectionStatus();
      this.setNetworkAlert();
    });

    this.emitter.on('web3/address', async address => {
      if (DEBUG) console.log('ToolsManager: on web3/address');

      this.setConnectionStatus();
      this.setNetworkAlert();

      if (this.menu && this.menu.loaded)
        await this.menu.loadPixels();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('web3/purchase', async address => {
      if (DEBUG) console.log('ToolsManager: on web3/purchase');

      if (this.menu && this.menu.activeTab === 'selection')
        await this.menu.createSettings();

      // Update infobox UI if user address changes
      if (this.infobox && !this.infobox.preventRefresh)
        await this.infobox.setUI();
    });

    this.emitter.on('selection/update', async pixels => {
      if (DEBUG) console.log('ToolsManager: on selection/update');

      pixels = pixels || this.game.selection.pixels;

      if (pixels.length === 1) {
        if (!this.infobox)
          await this.openInfoBox({ pixel: pixels[0], scene: this.game.scene });
        else
          await this.infobox.setUI();

        if (this.menu)
          this.clearMenu();
      } else if (pixels.length > 1) {
        if (this.infobox)
          this.clearInfoBox();

        if (!this.menu)
          await this.openMenu('selection');
        else if (this.menu) {
          if (this.menu.activeTab === 'selection') {
            await this.menu.loadPixels();
            this.menu.createSettings();
          }
        }
      }
    })

    this.emitter.on('selection/clear', async () => {
      if (DEBUG) console.log('ToolsManager: on selection/clear');

      if (this.menu)
        this.clearMenu();

      if (this.infobox)
        this.clearInfoBox();
    })
  }

  async openMenu(activeTab) {
    if (DEBUG) console.log('ToolsManager: openMenu');

    if (this.menu && this.menu.loaded)
      this.clearMenu();

    this.menu = new Menu({ parent: this.parent, game: this.game, activeTab });

    // Init is async 
    await this.menu.init();
  }

  async openInfoBox({ pixel }) {
    if (DEBUG) console.log('ToolsManager: openInfoBox');

    if (this.infobox)
      this.clearInfoBox()

    this.infobox = new InfoBox({ pixel: pixel, parent: this.parent, game: this.game });

    // Init is async, not sure if this is best approach
    await this.infobox.init();
  }

  setConnectionStatus() {
    /*if (DEBUG)*/ console.log('ToolsManager: setConnectionStatus');

    console.log('this.game.web3.metamask', this.game.web3.metamask)
    console.log('this.game.web3.isConnected', this.game.web3.isConnected)
    console.log('this.game.web3.activeAddress', this.game.web3.activeAddress)

    const icon = this.connectionStatus.querySelector('i');
    const dataClass = 'gg-data';
    const blockClass = 'gg-block';

    if (!this.game.web3.metamask)
      setBlock();
    else if (!this.game.web3.isConnected)
      setBlock();
    else if (!this.game.web3.activeAddress)
      setBlock();
    else {
      console.log('SET DATA');
      if (icon.classList.contains(blockClass))
        icon.classList.remove(blockClass);

      icon.classList.add(dataClass);
    }

    function setBlock() {
      console.log('SET BLOCK');
      if (icon.classList.contains(dataClass))
        icon.classList.remove(dataClass);

      icon.classList.add(blockClass);
    }
  }

  setNetworkAlert() {
    /*if (DEBUG)*/ console.log('ToolsManager: setNetworkAlert');

    console.log('this.game.web3.metamask', this.game.web3.metamask)
    console.log('this.game.web3.isConnected', this.game.web3.isConnected)
    console.log('this.game.web3.activeAddress', this.game.web3.activeAddress)

    let show = false;

    if (!this.game.web3.metamask) {
      this.networkAlert.innerText = 'Install Metamask';
      show = true;
    } else if (!this.game.web3.isConnected) {
      this.networkAlert.innerText = 'Connect to Mumbai Testnet';
      show = true;
    } else if (!this.game.web3.activeAddress) {
      this.networkAlert.innerText = 'Connect to Wallet';
      show = true;
    }

    if (show) {
      if (this.networkAlert.classList.contains('hide'))
        this.networkAlert.classList.remove('hide');

      this.networkAlert.classList.add('show');
    }
    else {
      if (this.networkAlert.classList.contains('show'))
        this.networkAlert.classList.remove('show');

      this.networkAlert.classList.add('hide');
    }
  }

  addBottomNav() {
    if (DEBUG) console.log('ToolsManager: addBottomNav');

    this.domBottomNav = document.createElement('div');
    this.domBottomNav.setAttribute('id', 'bottom-nav');

    this.domBottomNav.appendChild(new Button({
      elClasses: ['pixels', 'menu-btn'],
      iconClass: 'gg-row-last',
      clickAction: async () => {
        if (!this.menu || !this.menu.loaded) {
          if (this.infobox)
            this.clearInfoBox()

          await this.openMenu(this.game.selection.pixels.length > 0 ? 'selection' : null);
        } else
          await this.menu.loadPixels();
      }
    }));

    this.domBottomNav.appendChild(new Input(this.search, 'text', {
      scene: this.game.scene,
      type: 'text',
      placeholder: 'Find pixel.. (eg. RK438)',
      max: 6,
      onChange: async () => {
        console.log('ToolsManager: this.search.text onChange', this.search.text)
        if (this.menu && this.menu.loaded) {

          //await this.menu.loadPixels();
        }
      }
    }));

    this.parent.appendChild(this.domBottomNav);
  }

  addHeader() {
    if (DEBUG) console.log('ToolsManager: addConnectionStatus');

    this.header = document.createElement('div');
    this.header.setAttribute('id', 'header');

    this.title = document.createElement('h1');
    this.title.textContent = 'autopoietic.art';

    this.header.appendChild(this.title);
    this.parent.appendChild(this.header);
  }

  addConnectionStatus() {
    /*if (DEBUG)*/ console.log('ToolsManager: addConnectionStatus');

    this.domConnectionStatus = document.createElement('div');
    this.domConnectionStatus.setAttribute('id', 'connection-status');

    this.connectionStatus = new Button({
      elClasses: ['account', 'connection'],
      iconClass: 'gg-block',
      clickAction: async () => {
        if (!this.game.web3.activeAddress)
          await this.game.web3.getActiveAddress();
      }
    });

    this.domConnectionStatus.appendChild(this.connectionStatus);

    this.parent.appendChild(this.domConnectionStatus);

    this.setConnectionStatus();
  }

  addNetworkAlert() {
    /*if (DEBUG)*/ console.log('ToolsManager: addNetworkAlert');

    this.networkAlert = document.createElement('div');
    this.networkAlert.setAttribute('id', 'alert');

    this.parent.appendChild(this.networkAlert);

    this.setNetworkAlert();
  }

  addOverlay() {
    if (DEBUG) console.log('ToolsManager: addOverlay');

    this.overlay = document.createElement('div');
    this.overlay.classList.add('overlay');

    this.overlayContent = document.createElement('div');
    this.overlayContent.classList.add('slideshow');

    // Find better solution for this
    this.overlayContent.innerHTML = config.overlayContent;

    this.overlayNav = document.createElement('div');
    this.overlayNav.classList.add('nav');

    this.closeOverlay = document.createElement('button');
    this.closeOverlay.textContent = 'Close';

    const _self = this;

    this.closeOverlay.addEventListener('click', () => {
      _self.clearOverlay()
    });

    this.overlayNav.appendChild(this.closeOverlay);

    this.overlayContent.appendChild(this.overlayNav);
    this.overlay.appendChild(this.overlayContent);
    this.parent.appendChild(this.overlay);
  }

  addMinimap(scene) {
    /*if (DEBUG)*/ console.log("Toolsmanager: addMinimap", scene, this.game.scene);

    scene = scene || this.game.scene;

    const sizeRatio = (window.devicePixelRatio > 1) ? 5 + (5 * 0.5 / window.devicePixelRatio) : 5;
    const margin = 7;
    const margin2X = margin + margin;

    // Minimap size
    const width = 1000 / sizeRatio;
    const height = 1000 / sizeRatio;

    // Minimap position
    const x = margin2X;
    const y = scene.appConfig.canvasHeight - (height + margin2X);

    this.minimapWrapper = scene.add.zone(
      x,
      y,
      width,
      height
    )
      .setInteractive()
      .setOrigin(0)
      .setDepth(3)

    this.minimapBackground = scene.add.rectangle(
      x - margin,
      y - margin,
      width + margin2X,
      height + margin2X, Phaser.Display.Color.HexStringToColor('#181a1b').color, 1
    )
      .setOrigin(0)
      .setDepth(2)

    scene.minimap = new MinimapScene({
      appConfig: scene.appConfig,
      sceneConfig: {
        gridWidth: scene.gridWidth,
        gridHeight: scene.gridHeight,
        size: scene.size,
        sizeRatio,
        margin,
        width,
        height,
        x,
        y
      }
    }, this.minimapWrapper);

    scene.scene.add('MinimapScene', scene.minimap, true);
  }

  hideTools() {
    this.networkAlert.style.display = 'none';
    this.connectionStatus.style.display = 'none';
    this.domBottomNav.style.display = 'none';
    this.header.style.display = 'none';

    this.minimapWrapper.setVisible(false);
    this.minimapBackground.setVisible(false);
    this.game.scene.stop("MinimapScene");

    if (this.overlay)
      this.clearOverlay();
    if (this.infobox)
      this.clearInfoBox();
    if (this.menu)
      this.clearMenu();
  }

  showTools() {
    this.networkAlert.style.display = 'block';
    this.connectionStatus.style.display = 'block';
    this.domBottomNav.style.display = 'flex';
    this.header.style.display = 'block';

    this.minimapWrapper.setVisible(true);
    this.minimapBackground.setVisible(true);
    this.game.scene.start("MinimapScene");
  }

  clearOverlay() {
    if (DEBUG) console.log('ToolsManager: addOverlay');

    this.closeOverlay.removeEventListener('click', this.closeOverlay);
    this.parent.removeChild(this.overlay);

    this.overlay = null;
    this.overlayContent = null;
    this.overlayNav = null;
    this.closeOverlay = null;
  }

  clearInfoBox() {
    if (DEBUG) console.log('ToolsManager: clearInfoBox');

    this.infobox.destroy();
    this.infobox = null;
  }

  clearMenu() {
    if (DEBUG) console.log('ToolsManager: clearMenu');

    this.menu.destroy();
    this.menu = null;
  }
}
