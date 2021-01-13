
import { 
  numberToLetterColumn, 
  formatColorNumber, 
  stringToBN, 
  stringToHex, 
  toWei } from '@util/helpers';

export default class Pixel {

  constructor({ tile, scene }) {
    this.tile = tile;
    this.scene = scene;

    this.color = Phaser.Display.Color.HexStringToColor('#' + formatColorNumber(this.tile.fillColor));
  }

  get position() {
    return numberToLetterColumn(this.cy) + this.cx;
  }

  get cx() {
    return this.tile.cx;
  }

  get cy() {
    return this.tile.cy;
  }

  get HEXcolor() {
    return formatColorNumber(this.tile.fillColor);
  }

  get title() {
    return this.position;
  }

  get y() {
    return this.tile.y;
  }

  get x() {
    return this.tile.x;
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
}