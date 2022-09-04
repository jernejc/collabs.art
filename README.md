![Vercel](https://vercelbadge.vercel.app/api/jernejc/collabs.art)

# Idea and concept

Better described here:
<a href="https://unexpected-jupiter-4e2.notion.site/About-collabs-art-0c8e5af1deee4b6982b1c70fd354c9fc" target="_blank">Docs</a>


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
