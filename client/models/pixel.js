
import {
  numberToLetterColumn,
  formatColorNumber,
  stringToBN,
  stringToHex,
  hexToString,
  toWei,
  fromWei,
  formatPositionHex
} from '@util/helpers';

import { setInvertedStroke, resetStrokeStyle } from '@actions/user_interactions';

export default class Pixel {

  constructor({ tile, scene, color, cx, cy }) {
    this.tile = tile;
    this.scene = scene;
    this.cx = cx;
    this.cy = cy;

    if (color)
      this.color = Phaser.Display.Color.HexStringToColor('#' + formatColorNumber(color));
  }

  get position() {
    return numberToLetterColumn(this.cy) + this.cx;
  }

  get HEXcolor() {
    return formatColorNumber(this.color.color);
  }

  get y() {
    return (this.tile) ? this.tile.y : null;
  }

  get x() {
    return (this.tile) ? this.tile.x : null;
  }

  async buy() {
    if (DEBUG) console.log('BUY Pixel', this);

    let success = false;

    try {
      if (!this.scene.game.web3.activeAddress)
        await this.scene.game.web3.getActiveAddress();

      if (!this.scene.game.web3.activeAddress)
        return success;

      let price = this.price;

      if (typeof price === 'number')
        price = price.toString(); // web3.toWei needs strings or BN

      await this.scene.game.web3.bidContract.methods.purchase(
        stringToBN(this.position), // pixel position
        stringToHex(this.HEXcolor) // pixel color
      ).send({
        from: this.scene.game.web3.activeAddress,
        gas: 300000,
        value: toWei(price)
      });

      success = true;
    } catch (error) {
      console.error('Purchase pixel error', error);
    }

    return success;
  }

  async bid() {
    if (DEBUG) console.log('BID Pixel', pixel);

    let success = false;

    try {
      if (!this.scene.game.web3.activeAddress)
        await this.scene.game.web3.getActiveAddress();

      if (!this.scene.game.web3.activeAddress)
        return success;

      let price = this.price;

      if (typeof price === 'number')
        price = price.toString(); // web3.toWei needs strings or BN

      await this.scene.game.web3.bidContract.methods.placeBid(
        stringToBN(this.position), // pixel position
        3600 * 7 // duration in seconds: 7h
      ).send({
        from: this.scene.game.web3.activeAddress,
        gas: 300000,
        value: toWei(price)
      });

      success = true;
    } catch (error) {
      console.error('Purchase pixel error', error);
    }

    return success;
  }

  async setColor() {
    if (DEBUG) console.log("SET pixel", this.cx, this.cy, this.color, this.HEXcolor);

    this.scene.worldmap.setPixel(
      this.cx,
      this.cy,
      this.color.r,
      this.color.g,
      this.color.b
    )

    this.scene.worldmap.update();

    try {
      await this.scene.game.web3.pixelContract.methods.setColor(
        stringToBN(this.position), // pixel position
        stringToHex(this.HEXcolor) // pixel color
      ).send({
        from: this.scene.game.web3.activeAddress,
        gas: 200000
      });
    } catch (error) {
      console.error('setColor pixel error', error)
    }
  }

  async loadGraphData(refresh) {
    const data = await this.scene.game.graph.loadPixel({
      id: this.position
    }, refresh);

    if (!data)
      return;

    this.setGraphData(data);
  }

  setGraphData(data) {
    if (data.highestBid && data.highestBid.amount) { // Check for highest bid 
      this.highestBid = data.highestBid;
      this.highestBid.amount = parseFloat(fromWei(data.highestBid.amount)) // Conver from Wei
      this.highestBid.expired = (new Date(data.highestBid.expiresAt * 1000) - new Date() < 0);
      this.price = data.highestBid.amount + 0.001;
    } else
      this.highestBid = null;

    if (!this.price)
      this.price = this.scene.game.web3.defaultPrice;

    this.color = Phaser.Display.Color.HexStringToColor('#' + hexToString(data.color));
    this.owner = data.owner.toLowerCase();
  }

  setActivePixel() {
    if (this.tile)
      setInvertedStroke({ tile: this.tile, scene: this.scene });
  }

  clearActivePixel() {
    if (this.tile)
      resetStrokeStyle({ tile: this.tile, scene: this.scene });
  }

  static fromTile({ tile, scene }) {
    const color = tile.fillColor;
    const pixel = new Pixel({ tile, scene, color, cx: tile.cx, cy: tile.cy });

    if (!pixel.price)
      pixel.price = scene.game.web3.defaultPrice;

    return pixel;
  }

  static fromGraphData({ scene, data }) {
    const position = formatPositionHex(data.id);
    const pixel = new Pixel({ tile: null, scene, cx: position.cx, cy: position.cy });

    pixel.setGraphData(data);

    return pixel;
  }
}