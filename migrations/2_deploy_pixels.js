
const fs = require('fs');
const Web3 = require('web3');
const yaml = require('js-yaml');

const subgraphYAML = `${__dirname}/../subgraph/subgraph.yaml`;
const eventsYAML = `${__dirname}/../events/app.yaml`;

const Pixels = artifacts.require("Pixels");
const PixelsBid = artifacts.require("PixelsBid");

module.exports = async (deployer, network) => {

  console.log("Deploying Pixels on network " + network);
  const httpUrl = deployer.networks[network].url;

  if (!httpUrl)
    throw new Error('No network URL found.');

  const wsUrl = deployer.networks[network].websocket || null;
  const maxPixels = 1000000;
  const defaultPrice = Web3.utils.toWei('0.005');
  const contractFee = 10000;

  // Deploy contracts
  await deployer.deploy(Pixels, maxPixels);
  console.log("Pixels.address", Pixels.address);

  await deployer.deploy(PixelsBid, Pixels.address, defaultPrice, contractFee);
  console.log("PixelsBid.address", PixelsBid.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.addMinter(PixelsBid.address);

  // Create dapp config with new addresses
  const config = {
    httpUrl: httpUrl,
    wsUrl: wsUrl,
    PixelsAddress: Pixels.address,
    PixelsBidAddress: PixelsBid.address,
    ipfs: {
      host: 'ipfs.infura.io',
      protocol: 'https',
      port: 5001
    }
  }

  fs.writeFileSync(`${__dirname}/../dapp-config.json`, JSON.stringify(config, null, '\t'), 'utf8');

  // Update subgraph yaml
  const subgraphConf = yaml.load(fs.readFileSync(subgraphYAML, 'utf8'));

  // Loop through data sources
  subgraphConf.dataSources.forEach(data => {
    switch (data.source.abi) {
      case 'Pixels':
        data.source.address = Pixels.address;
        break;
      case 'PixelsBid':
        data.source.address = PixelsBid.address;
        break;
    }
  });

  const newSubgraphYAML = yaml.dump(subgraphConf);
  fs.writeFileSync(subgraphYAML, newSubgraphYAML, 'utf8');

  // Update events app yaml
  const eventsConf = yaml.load(fs.readFileSync(eventsYAML, 'utf8'));

  // Update ENV vars
  eventsConf.env_variables.PIXELS_ADDRESS = Pixels.address;
  eventsConf.env_variables.BIDS_ADDRESS = PixelsBid.address;
  eventsConf.env_variables.WSURL = wsUrl;

  const newEventsYAML = yaml.dump(eventsConf);
  fs.writeFileSync(eventsYAML, newEventsYAML, 'utf8');

  // Copy ABIs to events
  fs.writeFileSync(`${__dirname}/../events/abis/Pixels.json`, JSON.stringify(Pixels.abi), { flag: 'w' });
  fs.writeFileSync(`${__dirname}/../events/abis/PixelsBid.json`, JSON.stringify(PixelsBid.abi), { flag: 'w' });

  return;
};