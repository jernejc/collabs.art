
const crypto = require('crypto');

// Local imports
const db = require('./firestore');
const { findWorldImage } = require('./helpers');

module.exports = {
  getImage,
  joinWaitlist,
  validateAccess
}

async function joinWaitlist(req, res) {
  console.log('Routes: joinWaitlist', req.body)

  if (
    !req.body.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)
  )
    return res.status(400).send('Bad Request').end();

  const emailHash = crypto.createHash('md5').update(req.body.email).digest('hex');
  const documentRef = db.collection('emails').doc(emailHash);
  const documentSnap = await documentRef.get();

  if (documentSnap.exists)
    return res.send('OK').end();

  await documentRef.set({
    'email': req.body.email
  });

  return res.send('OK').end();
}

async function validateAccess(req, res) {
  console.log('Routes: validateAccess', req.body)
  return res.status(403).end();
}

async function getImage(req, res) {
  console.log('Routes: getImage', req.body)
  try {

    const file = await findWorldImage();
    const stream = file.createReadStream();

    res.writeHead(200, { 'Content-Type': 'image/png' });

    stream.on('data', function (data) {
      res.write(data);
    });

    stream.on('error', function (err) {
      console.log('error reading stream', err);
    });

    stream.on('end', function () {
      res.end();
    });
  } catch (error) {
    console.error('Failed to redirect', error);
    res.status(500).end()
  }
}