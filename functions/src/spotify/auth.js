const admin = require('firebase-admin')

const keys = require(__base + 'keys.json')
const config = require(__proj + 'config.json')
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
let lastAuthTime = null

// put authData(access tokens from first or refresh steps) to let
function setSpotifyAuthData(data) {
  spotifyAuthData = data
  lastAuthTime = Date.now();
  spotifyServer.defaults.headers['Authorization'] = data.token_type + ' ' + data.access_token
  console.log(spotifyServer.defaults.headers['Authorization'])
}

function login(request, response) {
  // query.code Required. Came from the first step of OAuth.
  if (!request.query.code) {
    response.status(400).send({
      message: "No Auth Code"
    })
    return
  }
  let userProfile = null

  // Post Spotify server for code verification & authorization code
    spotifyAuthServer.post('/token', qs.stringify({
      grant_type: 'authorization_code',
      code: request.query.code,
      redirect_uri: config.api_url + '/spotify/auth',
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
        response.render('spotify-auth-login', {
          spotify: spotifyAuthData,
          token: customToken,
          host: config.base_host,
        })
      })
      .catch(() => {
        console.log("Unknown Error")
      })
}

module.exports = router => {
  router.get('/spotify/auth', login)
}
