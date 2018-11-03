const admin = require('firebase-admin')
const functions = require('firebase-functions')
const db = admin.firestore()
const url_config = functions.config().urls
const axios = require('axios')
const qs = require('qs')

const spotifyKeys = functions.config().spotify
const spotifyAuthServer = axios.create({
  baseURL: 'https://accounts.spotify.com/api',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': "Basic " + Buffer.from(spotifyKeys.id + ':' + spotifyKeys.secret).toString('base64'),
  }
})

const spotifyServer = axios.create({
  baseURL: 'https://api.spotify.com/v1',
})

function login(req, res) {
  // query.code Required. Came from the first step of OAuth.
  if (!req.query.code) {
    const error = { message: "No Auth Code" }
    res.status(400).send(error)
    return Promise.reject(error)
  }

  // Post Spotify server for code verification & authorization code
  return spotifyAuthServer.post('/token', qs.stringify({
    grant_type: 'authorization_code',
    code: req.query.code,
    redirect_uri: url_config.func_host + url_config.func_base_url + '/spotify/auth',
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
                return userProfileRef.update({
                  'keys.spotify.access_token': spotifyAuthData.access_token,
                  'keys.spotify.refresh_token': spotifyAuthData.refresh_token,
                  'keys.spotify.expires': spotifyAuthData.expires_in + Date.now()/1000 | 0,
                  'keys.spotify.token_type': spotifyAuthData.token_type,
                  'keys.spotify.scope': spotifyAuthData.scope,
                })
              } else {
                return userProfileRef.set({
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
            }).catch(error => {
              console.log("Obtain user profile for " + user.uid + "failed because", error)
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
            host: url_config.host,
          })
          return Promise.resolve()
        })
    }).catch(error => {
        console.log("Unknown Error", error.response.data)
        res.status(500).send(error.response.data)
        return Promise.reject(error)
      })

}

function getClientCredential () {
  const docRef = db.collection('state').doc('spotify')
  return docRef.get()
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
            throw new functions.https.HttpsError('unavailable', 'Spotify Server Connection Failed', error)
          })
      } else {
        return doc.data()
      }
    })
    .then(data => {
      data.expires_in = data.expires - Date.now()/1000 | 0
      delete data.expires
      return data
    })
}

function refreshToken(uid) {
  const userProfileRef = db.collection('users').doc(uid)
  return userProfileRef.get()
    .then(doc => {
      if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'User Profile Not Exist')

      const data = doc.data()
      if (!data.keys || !data.keys.spotify || !data.keys.spotify.refresh_token)
        throw new functions.https.HttpsError('not-found', 'Refresh Token Not Exist')
      return spotifyAuthServer.post('/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: data.keys.spotify.refresh_token,
      }))
        .then(response => {
          userProfileRef.update({
            'keys.spotify.access_token': response.data.access_token,
            'keys.spotify.expires': response.data.expires_in + Date.now()/1000 | 0,
            'keys.spotify.token_type': response.data.token_type,
            'keys.spotify.scope': response.data.scope,
          })
          return response.data
        })
        .catch(error => {
          throw new functions.https.HttpsError('unavailable', 'Spotify Server Connection Failed', error)
        })
    })
}

const authorization = require(__src + 'middlewares/authorization')
module.exports = (router, funcs) => {
  router.get('/spotify/auth', login)
  router.get('/spotify/credential', (req, res) => {
    getClientCredential(req.user.uid)
      .then(result => {
        res.send(result)
        return Promise.resolve()
      })
      .catch(error => {
        console.log(error)
      })
  })
  router.get('/spotify/refresh', authorization, (req, res) => {
    refreshToken(req.user.uid)
      .then(result => {
        res.send(result)
        return Promise.resolve()
      })
      .catch(error => {
        console.log(error)
      })
  })
  funcs.spotifyRefreshToken = functions.https.onCall((data, context) => refreshToken(context.auth.uid))
  funcs.spotifyClientCredentials = functions.https.onCall(getClientCredential)
}
