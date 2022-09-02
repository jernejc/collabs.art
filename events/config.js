
const { CANVAS_ADDRESS, WSURL } = process.env;

module.exports = {
  'assests': 'assets',
  'wsUrl': WSURL,
	'canvasAddress': CANVAS_ADDRESS,
	'allowedOrigins': ['http://autopoietic.art','https://autopoietic.art','http://apoietic.com','https://apoietic.com','http://localhost:9000','https://beta.collabs.art','https://collabs.art'],
	'ipfs': {
		'host': 'ipfs.infura.io',
		'protocol': 'https',
		'port': 5001
	}
}