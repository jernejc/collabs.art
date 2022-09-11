
const fs = require('fs');
const yaml = require('js-yaml');

require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const { singletons } = require('@openzeppelin/test-helpers');

const CollabCanvas = artifacts.require("CollabCanvas");
const CollabToken = artifacts.require("CollabToken");

const subgraphYAML = `${__dirname}/../subgraph/subgraph.yaml`;
const eventsYAML = `${__dirname}/../events/app.yaml`;

module.exports = async (deployer, network, accounts) => {

  console.log("Deploying CollabCanvas on network " + network);
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
  const minUnit = 1;
  const conversionRate = 500;
  const developmentRate = 10000000;
  const supportedColors = [
    '93002c', 'c33502', 'c48100', 'c3a428', '027d4e', '029d5d',
    '60b640', '005a54', '007a81', '1a3f7e', '2a6fb5', '3fb4bd',
    '382d95', '5347c4', '63177b', '883992', 'c32b62', 'c47583',
    '553722', '77501c', '000000', '6a6c70', 'a2a3a6', 'c3c3c3']
    .map(item => web3.utils.stringToHex(item));

  // Deploy contracts
  await deployer.deploy(CollabCanvas, maxPixels, minUnit);
  console.log("CollabCanvas.address", CollabCanvas.address);

  await deployer.deploy(CollabToken, "CollabToken", "COLAB", [CollabCanvas.address], conversionRate, developmentRate);
  console.log("CollabToken.address", CollabToken.address);

  const CollabCanvasInstance = await CollabCanvas.deployed();

  await CollabCanvasInstance.setTokenContract(CollabToken.address);
  await CollabCanvasInstance.setSupportedColors(supportedColors);

  // Create dapp config with new addresses
  const config = {
    httpUrl: httpUrl,
    wsUrl: wsUrl || null,
    CollabCanvasAddress: CollabCanvas.address,
    CollabTokenAddress: CollabToken.address,
    ipfs: {
      host: 'ipfs.infura.io',
      protocol: 'https',
      port: 5001
    }
  }

  fs.writeFileSync(`${__dirname}/../config.json`, JSON.stringify(config, null, '\t'), 'utf8');

  // Update subgraph yaml
  const subgraphConf = yaml.load(fs.readFileSync(subgraphYAML, 'utf8'));

  // Loop through data sources
  subgraphConf.dataSources.forEach(data => {
    switch (data.source.abi) {
      case 'CollabCanvas':
        data.source.address = CollabCanvas.address;
        break;
    }
  });

  const newSubgraphYAML = yaml.dump(subgraphConf);
  fs.writeFileSync(subgraphYAML, newSubgraphYAML, 'utf8');

  // Update events app yaml
  const eventsConf = yaml.load(fs.readFileSync(eventsYAML, 'utf8'));

  // Update ENV vars
  eventsConf.env_variables.CANVAS_ADDRESS = CollabCanvas.address;
  eventsConf.env_variables.TOKEN_ADDRESS = CollabToken.address;
  eventsConf.env_variables.WSURL = wsUrl;

  const newEventsYAML = yaml.dump(eventsConf);
  fs.writeFileSync(eventsYAML, newEventsYAML, 'utf8');

  // Copy ABIs to client
  fs.writeFileSync(`${__dirname}/../client/abis/CollabCanvas.json`, JSON.stringify(CollabCanvas.abi), { flag: 'w' });
  fs.writeFileSync(`${__dirname}/../client/abis/CollabToken.json`, JSON.stringify(CollabToken.abi), { flag: 'w' });

  // Copy ABIs to events
  fs.writeFileSync(`${__dirname}/../events/abis/CollabCanvas.json`, JSON.stringify(CollabCanvas.abi), { flag: 'w' });
  fs.writeFileSync(`${__dirname}/../events/abis/CollabToken.json`, JSON.stringify(CollabToken.abi), { flag: 'w' });

  return;
};