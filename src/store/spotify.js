import axios from 'axios'

import { auth } from '@/plugins/firebase'

import store from './index'

import { encodeURL } from '@/utils'

const client = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  timeout: 10000,
  headers: {},
})

const appAuthEndpoint = axios.create({
  baseURL: process.env.VUE_APP_API_ENDPOINT + '/spotify/auth',
  timeout: 30000,
  headers: {}
})

client.interceptors.response.use(
  response => response,
  error => {
    // TODO: If the request was ever rejected for outdated codes, automatically refresh the token or prompt login.
  }
)

auth.onAuthStateChanged(user => {
  if (!user) {
    store.commit('spotify/resetToken')
  }
})

export const GetClientCredentials = () => appAuthEndpoint.get('/client-credential')
export const RefreshToken = () => appAuthEndpoint.get('/refresh')

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
      const theURL =  process.env.VUE_APP_API_ENDPOINT + '/spotify/auth/login'
      const newWindow = window.open(theURL, 'spotify-login', 'height=500,width=700')
      if (window.focus) newWindow.focus()

      return new Promise((resolve, reject) => {
        function spotifyLoginCallback (event) {
          if (event.origin !== process.env.VUE_APP_API_ENDPOINT) {
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
    refreshToken ({ commit, dispatch }, fallback) {
      return RefreshToken()
        .then(response => {
          console.log('RefreshToken', response.data)
          commit('authenticate', response.data)
        })
    },
    request ({ commit, state, getters, dispatch }, params) {
      // Params.fallback default to true
      if (params === undefined) params = {}
      if (params.fallback === undefined) params.fallback = true
      const expireTime = state.accessTokenExpires
      if (expireTime && (expireTime - ((Date.now() / 1000) | 0) > 10)) {
        // Expiration happens in the future. Use the token directly.
        return Promise.resolve(getters['client'])
      } else {
        (
          state.authenticated ?
            dispatch('refreshToken') :
            Promise.reject(new Error('User not authenticated'))
        )
          .catch(error => {
            console.log(error)
            if (params.fallback) return dispatch('getClientCredentials')
            else throw error
          })
          .then(() => getters['client'])
      }
    }
  },
  getters: {
    client (state) {
      client.defaults.headers['Authorization'] = 'Bearer' + ' ' + state.accessToken
      return client
    }
  }
}
