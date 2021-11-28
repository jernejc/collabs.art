
const { PIXELS_ADDRESS, BIDS_ADDRESS, WSURL } = process.env;

module.exports = {
  'assests': 'assets',
  'wsUrl': WSURL,
	'PixelsAddress': PIXELS_ADDRESS,
	'PixelsBidAddress': BIDS_ADDRESS,
	'allowedOrigins': ['http://autopoietic.art','https://autopoietic.art','http://apoietic.com','https://apoietic.com','http://localhost:9000'],
	'ipfs': {
		'host': 'ipfs.infura.io',
		'protocol': 'https',
		'port': 5001
	}
}