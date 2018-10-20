const admin = require('firebase-admin')
const db = admin.firestore()
const config = require(__proj + 'config.json')
const keys = require(__base + 'keys.json').spotify
const axios = require('axios')
const qs = require('qs')

const spotifyAuthServer = axios.create({
  baseURL: 'https://accounts.spotify.com/api',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': "Basic " + Buffer.from(keys.client_id + ':' + keys.client_secret).toString('base64'),
  }
})

const spotifyServer = axios.create({
  baseURL: 'https://api.spotify.com/v1',
})

function login(req, res) {
  // query.code Required. Came from the first step of OAuth.
  if (!req.query.code) {
    res.status(400).send({
      message: "No Auth Code"
    })
    return
  }

  // Post Spotify server for code verification & authorization code
  return spotifyAuthServer.post('/token', qs.stringify({
    grant_type: 'authorization_code',
    code: req.query.code,
    redirect_uri: config.func_host + config.func_base_url + '/spotify/auth',
  }))
    .then(response => {
      const spotifyAuthData = response.data
      console.log(spotifyAuthData)
      spotifyServer.defaults.headers['Authorization'] = spotifyAuthData.token_type + ' ' + spotifyAuthData.access_token
      return spotifyServer.get('/me') // Request user profile
        .catch(error => {
          if (error.response && error.response.data) {
            console.log(error.request)
            res.status(error.response.status).send(error.response.data)
          } else {
            res.status(500).send("Server Unknown Error")
            console.log(error)
          }
          return Promise.reject(error)
        })
        .then(response => {
          return admin.auth().getUserByEmail(response.data.email) // Query user by email in firebase
            .catch(error => {
              if (error.code === 'auth/user-not-found') {
                // No User
                return admin.auth().createUser({
                  displayName: response.data.display_name,
                  email: response.data.email,
                  emailVerified: true,
                })
              }
              // Unknown Error
              res.send(error)
              return Promise.reject(error)
            })
        })
        .then(user => {
          // Now we have the user
          const userProfileRef = db.collection('users').doc(user.uid)
          userProfileRef.get()
            .then(userProfile => {
              if (userProfile.exists) {
                userProfileRef.update({
                  'keys.spotify.access_token': spotifyAuthData.access_token,
                  'keys.spotify.refresh_token': spotifyAuthData.refresh_token,
                  'keys.spotify.expires': spotifyAuthData.expires_in + Date.now()/1000 | 0,
                  'keys.spotify.token_type': spotifyAuthData.token_type,
                  'keys.spotify.scope': spotifyAuthData.scope,
                })
              } else {
                userProfileRef.set({
                  keys: {
                    spotify: {
                      access_token: spotifyAuthData.access_token,
                      refresh_token: spotifyAuthData.refresh_token,
                      token_type: spotifyAuthData.token_type,
                      expires: spotifyAuthData.expires_in + Date.now()/1000 | 0,
                      scope: spotifyAuthData.scope,
                    }
                  }
                })
              }
            })
            return admin.auth().createCustomToken(user.uid)
        })
        .then(customToken => {
          res.render('spotify-auth-login', {
            spotify: {
              access_token: spotifyAuthData.access_token,
              expires_in: spotifyAuthData.expires_in,
            },
            token: customToken,
            host: config.host,
          })
        })
        .catch(() => {
          console.log("Unknown Error")
        })
    })

}

function getClientCredential (req, res) {
  const docRef = db.collection('state').doc('spotify')
  docRef.get()
    .then(doc => {
      // Expires in 10 mins
      if (!doc.exists || !doc.data().expires || (doc.data().expires - Date.now()/1000) < 600 ) {
        // Get a new one
        return spotifyAuthServer.post('/token', qs.stringify({
          grant_type: 'client_credentials',
        }))
          .then(response => {
            const data = response.data
            data.expires = data.expires_in + Date.now()/1000 | 0
            delete data.scope
            delete data.expires_in
            docRef.set(response.data)
            return response.data
          })
          .catch(error => {
            if (error.response && error.response.data) {
              console.log(error.request)
              res.status(error.response.status).send(error.response.data)
            } else {
              res.status(500).send("Server Unknown Error")
              console.log(error)
            }
          })
      } else {
        return doc.data()
      }
    })
    .then(data => {
      data.expires_in = data.expires - Date.now()/1000 | 0
      delete data.expires
      res.send(data)
    })
}

function refreshToken(req, res) {
  const userProfileRef = db.collection('users').doc(req.user.uid)
  userProfileRef.get()
    .then(doc => {
      if (!doc.exists) {
        throw {
          code: 404,
          message: 'User Profile Not Exist',
        }
      }

      const data = doc.data()
      if (!data.keys || !data.keys.spotify || !data.keys.spotify.refresh_token) {
        throw {
          code: 404,
          message: 'Refresh Token Not Exist',
        }
      }
      return spotifyAuthServer.post('/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: data.keys.spotify.refresh_token,
      }))
        .then(response => {
          const data = response.data
          res.send(data)
          return userProfileRef.update({
            'keys.spotify.access_token': data.access_token,
            'keys.spotify.expires': data.expires_in + Date.now()/1000 | 0,
            'keys.spotify.token_type': data.token_type,
            'keys.spotify.scope': data.scope,
          })
        })
    })
    .catch(error => {
      res.status(error.code).send(error.message)
    })


}

const authorization = require(__src + 'middlewares/authorization')
module.exports = router => {
  router.get('/spotify/auth', login)
  router.get('/spotify/credential', getClientCredential)
  router.get('/spotify/refresh', authorization, refreshToken)
}
