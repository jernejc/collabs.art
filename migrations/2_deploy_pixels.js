const Pixels = artifacts.require("Pixels");
const PixelsBid = artifacts.require("PixelsBid");

module.exports = async (deployer, network) => {
  console.log('Deploying Pixels on network ' + network);

  await deployer.deploy(Pixels, 1000000);
  console.log('Pixels.address', Pixels.address);

  await deployer.deploy(PixelsBid, Pixels.address, 100);
  console.log('PixelsBid.address', PixelsBid.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.addMinter(PixelsBid.address);

  return;
};