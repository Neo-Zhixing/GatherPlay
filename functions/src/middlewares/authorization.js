const admin = require('firebase-admin')
module.exports = function(req, res, next) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized')
    return
  }

  let idToken = req.headers.authorization.split('Bearer ')[1]
  admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
    req.user = decodedIdToken
    return next()
  }).catch((error) => {
    res.status(401).send({
      message: 'Unauthorized - ID Token Verification Failed',
      error: error,
    })
  })
}
