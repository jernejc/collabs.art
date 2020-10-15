const Pixels = artifacts.require("Pixels");
const PixelsPurchase = artifacts.require("PixelsPurchase");

module.exports = async (deployer, network) => {
  console.log('Deploying Pixels on network ' + network);

  await deployer.deploy(Pixels, 1000000);
  console.log('Pixels.address', Pixels.address);

  await deployer.deploy(PixelsPurchase, Pixels.address, 100);
  console.log('PixelsPurchase.address', PixelsPurchase.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.addMinter(PixelsPurchase.address);

  return;
};