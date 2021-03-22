# PixelWorld

The world is a grid of 1.000.000 pixels, where each pixel is represented by a non-fungible token (NFT) on the Ethereum network. Ownership is stored and transfered based on the <a href="https://eips.ethereum.org/EIPS/eip-721" target="_blank">ERC-721 standard</a> as most digital art and collectibles. It cannot be taken away or destroyed. 

Each position has unique identifier within the grid:

<pre>
    0 →              999
  A ┌──────────────────┐  
  ↓ │                  │  Horizontal axis are numbers from 0 to 999.
    │    TN220         │  Vertical axis are letters from A to ALK.
    │     ┌─┐          │  
    │     └─┘          │  Example ID: <b>TN220</b>
    │                  │  Vertical: <b>TN</b> Horizontal: <b>220</b>
    │                  │  
ALK └──────────────────┘ 
</pre>

Within the same <a href="https://en.wikipedia.org/wiki/Smart_contract" target="_blank">smart contract</a> owners can set colors to their pixels and thus contribute to the final outlook of the world.

## ERC721Batch

The application is using a modified version of ERC-721 with additional batch support. It's based on OpenZeppelins ERC-721 with three additional methods:

- _mintBatch
- _transferBatch
- _burnBatch

The new functionallity allows you to create, transfer and destroy more than one token at a time. Inspired by <a href="https://eips.ethereum.org/EIPS/eip-1155" target="_blank">ERC-1155 Multi Token Standard</a>, the goal is to reduce gas cost when operating with large numbers of tokens.

## Client app

Rendering of the world and minimap is done by <a href="https://phaser.io/" target="_blank">Phaser</a> the HTML5 game framework. Overlaying that is a simple layer of components and services, written with Vanilla JS and CSS.

## Subgraph

All pixels and their bids are indexed using <a href="https://thegraph.com/" target="_blank">The Graph protocol</a>.

## Dev (run locally)

Make sure to have a recent version of <a href="https://nodejs.org/en/" target="_blank">Node.js</a> installed, including global packages `truffle` and `ganache-cli`. Also make sure to install <a href="https://www.docker.com/" target="_blank">Docker</a> and that it's running.

1.) Install project dependencies

```
npm install
```

2.) Start Ganache on 0.0.0.0 so it's accessible from within Docker.

```
ganache-cli -h 0.0.0.0
```

3.) Run local Graph Node (<a href="https://thegraph.com/docs/quick-start#2.-run-a-local-graph-node" target="_blank">details</a>)

In another terminal:
```
git clone https://github.com/graphprotocol/graph-node/
```
Move to Docker directory and start a local Graph Node
```
cd graph-node/docker
docker-compose up
```

4.) Build and migrate smart contracts 

Migrate smart contracts to local Ganache.

In app root directory:
```
truffle migrate
```
This should build, deploy the contracts and generate dapp-config.json.

5.) Create and deploy local subgraph (<a href="https://thegraph.com/docs/quick-start#5.-deploy-the-subgraph-to-the-local-graph-node" target="_blank">details</a>)

Make sure you have <a href="https://github.com/graphprotocol/graph-cli" target="_blank">Graph CLI</a> installed.

In app subgraph directory:
```
npm run create-local
npm run deploy-local
```

6.) Run local development server

In app root directory:
```
npm run dev
```

If all goes well, the client application should be available at http://localhost:9000
