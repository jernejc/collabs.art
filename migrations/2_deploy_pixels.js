
const fs = require('fs');
const yaml = require('js-yaml');

const web3 = require('web3');

require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const CollabCanvas = artifacts.require("CollabCanvas");
const CollabToken = artifacts.require("CollabToken");

const subgraphYAML = `${__dirname}/../subgraph/subgraph.yaml`;

module.exports = async (deployer, network, accounts) => {

  console.log("Deploying CollabCanvas on network " + network);
  const networkName = network.replace('-fork', '');
  const httpUrl = deployer.networks[networkName].url;

  if (!httpUrl)
    throw new Error('No network URL found.');

  const wsUrl = deployer.networks[networkName].websocket || null;
  const maxPixels = 1000000;
  const minUnit = web3.utils.toWei('1');
  const conversionRate = 2;
  const intialSupply = 165000000;
  const supportedColors = [
    '93002c', 'c33502', 'c48100', 'c3a428', '027d4e', '029d5d',
    '60b640', '005a54', '007a81', '1a3f7e', '2a6fb5', '3fb4bd',
    '382d95', '5347c4', '63177b', '883992', 'c32b62', 'c47583',
    '553722', '77501c', '000000', '6a6c70', 'a2a3a6', 'c3c3c3']
    .map(item => web3.utils.stringToHex(item));

  // Deploy contracts
  await deployer.deploy(CollabCanvas, maxPixels, minUnit);
  console.log("CollabCanvas.address", CollabCanvas.address);

  await deployer.deploy(CollabToken, "CollabToken", "COLAB", [CollabCanvas.address], conversionRate, intialSupply);
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

  fs.writeFileSync(`${__dirname}/../dapp_config.json`, JSON.stringify(config, null, '\t'), 'utf8');

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

  // Copy ABIs to client
  fs.writeFileSync(`${__dirname}/../client/abis/CollabCanvas.json`, JSON.stringify(CollabCanvas.abi), { flag: 'w' });
  fs.writeFileSync(`${__dirname}/../client/abis/CollabToken.json`, JSON.stringify(CollabToken.abi), { flag: 'w' });

  // Copy ABIs to subgraph
  fs.writeFileSync(`${__dirname}/../subgraph/abis/CollabCanvas.json`, JSON.stringify(CollabCanvas.abi), { flag: 'w' });

  return;
};