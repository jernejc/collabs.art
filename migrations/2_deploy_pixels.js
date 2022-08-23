
const fs = require('fs');
const yaml = require('js-yaml');

require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const { singletons } = require('@openzeppelin/test-helpers');

const Pixels = artifacts.require("Pixels");
const CollabToken = artifacts.require("CollabToken");

const subgraphYAML = `${__dirname}/../subgraph/subgraph.yaml`;
const eventsYAML = `${__dirname}/../events/app.yaml`;

module.exports = async (deployer, network, accounts) => {

  console.log("Deploying Pixels on network " + network);
  const networkName = network.replace('-fork', '');
  const httpUrl = deployer.networks[networkName].url;

  if (!httpUrl)
    throw new Error('No network URL found.');

  if (network === 'development') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
  }

  const wsUrl = deployer.networks[networkName].websocket || null;
  const maxPixels = 1000000;
  const conversionRate = 500;
  const developmentRate = 10000000;

  // Deploy contracts
  await deployer.deploy(Pixels, maxPixels);
  console.log("Pixels.address", Pixels.address);

  await deployer.deploy(CollabToken, "CollabToken", "COLAB", [Pixels.address], conversionRate, developmentRate);
  console.log("CollabToken.address", CollabToken.address);

  const PixelsInstance = await Pixels.deployed();
  await PixelsInstance.setTokenContract(CollabToken.address);

  // Create dapp config with new addresses
  const config = {
    httpUrl: httpUrl,
    wsUrl: wsUrl,
    PixelsAddress: Pixels.address,
    CollabTokenAddress: CollabToken.address,
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
    }
  });

  const newSubgraphYAML = yaml.dump(subgraphConf);
  fs.writeFileSync(subgraphYAML, newSubgraphYAML, 'utf8');

  // Update events app yaml
  const eventsConf = yaml.load(fs.readFileSync(eventsYAML, 'utf8'));

  // Update ENV vars
  eventsConf.env_variables.PIXELS_ADDRESS = Pixels.address;
  eventsConf.env_variables.TOKEN_ADDRESS = CollabToken.address;
  eventsConf.env_variables.WSURL = wsUrl;

  const newEventsYAML = yaml.dump(eventsConf);
  fs.writeFileSync(eventsYAML, newEventsYAML, 'utf8');

  // Copy ABIs to events
  fs.writeFileSync(`${__dirname}/../events/abis/Pixels.json`, JSON.stringify(Pixels.abi), { flag: 'w' });
  fs.writeFileSync(`${__dirname}/../events/abis/CollabToken.json`, JSON.stringify(CollabToken.abi), { flag: 'w' });

  return;
};