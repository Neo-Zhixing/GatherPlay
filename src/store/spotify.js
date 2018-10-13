import keys from '@/keys.json'
import firebase from '@/plugins/firebase'
import axios from 'axios'

export const client = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  timeout: 1000,
  headers: {},
})

export default {
  namespaced: true,
  state: {
    authData: null,
    playingTrack: null,
    playingTrackPullInterval: 5000,
  },
  mutations: {
    createAuthData (state, data) {
      state.authData = data
    },
    updatePlayingTrack (state, data) {
      state.playingTrack = data
    },
    setPlayingTrackPullInterval (state, interval) {
      state.playingTrackPullInterval = interval
    }
  },
  actions: {
    login ({ commit, dispatch }) {
      const scopes = keys.spotify.scopes.join(' ')
      const theURL = 'https://accounts.spotify.com/authorize?' +
        'response_type=code&' +
        `client_id=${keys.spotify.client_id}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(keys.spotify.callback_url)}`
      const newWindow = window.open(theURL, 'spotify-login', 'height=500,width=700')
      if (window.focus) newWindow.focus()

      function spotifyLoginCallback (event) {
        if (event.origin !== keys.spotify.callback_origin) {
          return
        }
        window.removeEventListener('message', spotifyLoginCallback, false)
        firebase.auth().signInWithCustomToken(event.data.token)
        console.log(event.data.spotify)
        commit('createAuthData', event.data.spotify)
      }
      window.addEventListener('message', spotifyLoginCallback, false)
    },
    pullCurrentPlayback({ commit, getters, dispatch, state }) {
      getters.client.get('/me/player/currently-playing', {}).then(response => {
        commit('updatePlayingTrack', response.data)
        if (state.playingTrackPullInterval === null) {
          return
        }
        setTimeout(() => {
          dispatch('pullCurrentPlayback')
        }, state.playingTrackPullInterval)
      })
    }
  },
  getters: {
    client (state) {
      if (!state.authData) return null
      client.defaults.headers['Authorization'] = state.authData['token_type'] + ' ' + state.authData['access_token']
      return client
    }
  },
}
