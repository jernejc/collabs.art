
const fs = require('fs');
const Web3 = require('web3');

const Pixels = artifacts.require("Pixels");
const PixelsBid = artifacts.require("PixelsBid");

module.exports = async (deployer, network) => {
  console.log("Deploying Pixels on network " + network);

  const httpUrl = deployer.networks[network].url;
  console.log('httpUri', httpUrl);
  console.log('deployer.networks[network]', deployer.networks[network]);

  let wsUrl = '';
  
  if (httpUrl) 
    wsUrl = httpUrl.replace('http', 'ws');

  const maxPixels = 1000000;
  const defaultPrice = Web3.utils.toWei('0.005');
  const contractFee = 10000;

  console.log('defaultPrice', defaultPrice);

  await deployer.deploy(Pixels, maxPixels);
  console.log("Pixels.address", Pixels.address);

  await deployer.deploy(PixelsBid, Pixels.address, defaultPrice, contractFee);
  console.log("PixelsBid.address", PixelsBid.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.addMinter(PixelsBid.address);

  let config = {
    httpUrl: httpUrl,
    wsUrl: wsUrl,
    PixelsAddress: Pixels.address,
    PixelsBidAddress: PixelsBid.address,
    /*accounts: accounts,
    wallets: wallets,*/
    ipfs: {
      host: 'ipfs.infura.io',
      protocol: 'https',
      port: 5001
    }

  }

  fs.writeFileSync(__dirname + '/../src/dapp-config.json', JSON.stringify(config, null, '\t'), 'utf8');

  return;
};