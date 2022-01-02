// [START firestore_quickstart]
const {Firestore} = require('@google-cloud/firestore');

// Create a new client
const db = new Firestore();

module.exports = db;