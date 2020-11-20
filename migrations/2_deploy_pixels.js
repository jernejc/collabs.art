const Pixels = artifacts.require("Pixels");
const PixelsBid = artifacts.require("PixelsBid");

module.exports = async (deployer, network) => {
  console.log("Deploying Pixels on network " + network);

  const maxPixels = 1000000;
  const defaultPrice = 1000000;
  const contractFee = 10000;

  await deployer.deploy(Pixels, maxPixels);
  console.log("Pixels.address", Pixels.address);

  await deployer.deploy(PixelsBid, Pixels.address, defaultPrice, contractFee);
  console.log("PixelsBid.address", PixelsBid.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.addMinter(PixelsBid.address);

  return;
};