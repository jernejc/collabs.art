const Pixels = artifacts.require("Pixels");
const PixelsBuy = artifacts.require("PixelsBuy");

module.exports = async (deployer, network) => {
  console.log('Deploying pixels on network', network);

  await deployer.deploy(Pixels);
  console.log('Pixels.address', Pixels.address);

  await deployer.deploy(PixelsBuy, Pixels.address, 100);
  console.log('PixelsBuy.address', PixelsBuy.address);

  return;
};