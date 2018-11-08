import axios from 'axios'

import { auth, functions } from '@/plugins/firebase'

import store from './index'

import { encodeURL } from '@/utils'

const client = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  timeout: 10000,
  headers: {},
})

client.interceptors.response.use(
  response => response,
  error => {
    // If the request was ever rejected for outdated codes, automatically refresh the token or prompt login.
  }
)

auth.onAuthStateChanged(user => {
  if (!user) {
    store.commit('spotify/resetToken')
  }
})

export const GetClientCredentials = functions.httpsCallable('spotifyClientCredentials')
export const RefreshToken = functions.httpsCallable('spotifyRefreshToken')

const spotifyScope = [
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-playback-state"
]

export default {
  namespaced: true,
  state: {
    authenticated: false,
    accessToken: null,
    accessTokenExpires: null,
  },
  mutations: {
    updateToken (state, data) {
      state.authenticated = false
      state.accessToken = data.access_token
      state.accessTokenExpires = data.expires || (data.expires_in + (Date.now() / 1000 | 0))
    },
    resetToken (state, data) {
      state.accessToken = null
      state.accessTokenExpires = null
      state.authenticated = false
    },
    authenticate (state, data) {
      state.authenticated = true
      state.accessToken = data.access_token
      state.accessTokenExpires = data.expires || (data.expires_in + (Date.now() / 1000 | 0))
    },
  },
  actions: {
    login ({ commit }) {
      const theURL = 'https://accounts.spotify.com/authorize?' + encodeURL({
        response_type: 'code',
        client_id: process.env.VUE_APP_SPOTIFY_CLIENT_ID,
        scope: spotifyScope,
        redirect_uri: process.env.VUE_APP_FUNC_HOST + process.env.VUE_APP_FUNC_BASE + '/spotify/auth/login',
      })
      const newWindow = window.open(theURL, 'spotify-login', 'height=500,width=700')
      if (window.focus) newWindow.focus()

      return new Promise((resolve, reject) => {
        function spotifyLoginCallback (event) {
          if (event.origin !== process.env.VUE_APP_FUNC_HOST) {
            return
          }
          window.removeEventListener('message', spotifyLoginCallback, false)
          auth.signInWithCustomToken(event.data.token)
          commit('authenticate', event.data.spotify)
          resolve(event.data.spotify)
        }
        window.addEventListener('message', spotifyLoginCallback, false)
      })
    },
    getClientCredentials ({ commit }) {
      return GetClientCredentials()
        .then(response => {
          console.log('GetClientCredentials', response.data)
          commit('updateToken', response.data)
        })
    },
    refreshToken ({ commit }) {
      return RefreshToken()
        .then(response => {
          console.log('RefreshToken', response.data)
          commit('authenticate', response.data)
        })
    },
    request ({ commit, state }) {
      const expireTime = state.accessTokenExpires
      if (expireTime && (expireTime - ((Date.now() / 1000) | 0) > 10)) {
        // Expiration happens in the future. Use the token directly.
        client.defaults.headers['Authorization'] = 'Bearer' + ' ' + state.accessToken
        return Promise.resolve(client)
      } else {
        // Need to update token
        // TODO: If spotify was authenticated AND user was logged in, Refresh, if failed, Client Credentials.
        const getClientCredentialTask = () => GetClientCredentials()
          .then(response => {
            console.log(response.data)
            commit('updateToken', response.data)
          })
        if (state.authenticated) {
          return RefreshToken()
            .then(response => {
              console.log(response.data)
              commit('authenticate', response.data)
            })
            .catch(error => {
              console.log(error)
              return getClientCredentialTask()
            })
        } else {
          return getClientCredentialTask()
        }
      }
    }
  }
}
