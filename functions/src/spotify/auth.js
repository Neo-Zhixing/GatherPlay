const admin = require('firebase-admin')

const keys = require('../keys.json')
const spotifyKeys = keys.spotify
const axios = require('axios')
const qs = require('qs')


const spotifyAuthServer = axios.create({
  baseURL: 'https://accounts.spotify.com/api',
})

const spotifyServer = axios.create({
  baseURL: 'https://api.spotify.com/v1',
})
let spotifyAuthData = null
function setSpotifyAuthData(data) {
  spotifyAuthData = data
  spotifyServer.defaults.headers['Authorization'] = data.token_type + ' ' + data.access_token
  console.log(spotifyServer.defaults.headers['Authorization'])
}


exports.handler = function (request, response) {
  // query.code Required. Came from the first step of OAuth.
  if (!request.query.code) {
    response.status(400).send({
      message: "No Auth Code",
      myRLS: request.baseUrl,
      daf: request.originalUrl
    })
    return
  }
  let userProfile = null
  // Post Spotify server for code verification & authorization code
  spotifyAuthServer.post('/token', qs.stringify({
    grant_type: 'authorization_code',
    code: request.query.code,
    redirect_uri: 'http://localhost:5001/gather-play/us-central1/api/spotify/auth',
    client_id: spotifyKeys.client_id,
    client_secret: spotifyKeys.client_secret,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': "Basic " + Buffer.from(spotifyKeys.client_id + ':' + spotifyKeys.client_secret).toString('base64'),
    }
  })
    .then(r => {
      setSpotifyAuthData(r.data) // Save Auth Data
      return spotifyServer.get('/me') // Request user profile
    }, error => {
      if (error.response && error.response.data) {
        console.log(error.request)
        response.status(error.response.status).send({
          request: error.request.data,
          response: error.response.data,
        })
      } else {
        response.status(500).send("Server Unknown Error")
        console.log(error)
      }
    })
    .then(r => {
      userProfile = r.data
      return admin.auth().getUserByEmail(r.data.email) // Query user by email in firebase
    }, error => {
      // Failed to get the profile
      if (error.response && error.response.data) {
        response.status(error.response.status).send({
          request: error.request.data,
          response: error.response.data,
        })
      } else {
        response.status(500).send("Server Unknown Error during profile fetching")
        console.log(error)
      }
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        // No User
        return admin.auth().createUser({
          displayName: userProfile.display_name,
          email: userProfile.email,
          emailVerified: true,
        })
      }
      // Unknown Error
      throw error
    })
    .then(user => {
      // Now we have the user
      return admin.auth().createCustomToken(user.uid)
    })
    .then(customToken => {
      response.send(
`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body><script>\
console.log(window.opener);\
window.opener.postMessage({token:'${customToken}', spotify:${JSON.stringify(spotifyAuthData)}}, '${keys.host}');\
window.close();\
</script></body></html>`)
      return null
    })
    .catch(() => {
      console.log("Unknown Error")
    })
}
