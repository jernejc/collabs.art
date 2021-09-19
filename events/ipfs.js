
const { IPFS_PROJECT_ID, IPFS_PROJECT_SECRET } = process.env;

const config = require('./config');
const { create } = require('ipfs-http-client');

const auth =
  'Basic ' + Buffer.from(IPFS_PROJECT_ID + ':' + IPFS_PROJECT_SECRET).toString('base64');

const client = create({
  host: config.ipfs.host,
  port: config.ipfs.port,
  protocol: config.ipfs.protocol,
  headers: {
    authorization: auth
  }
})

module.exports = client;