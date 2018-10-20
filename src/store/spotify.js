import keys from '@/keys.json'
import configs from '@/../config.json'
import { auth, db } from '@/plugins/firebase'
import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  timeout: 10000,
  headers: {},
})

export default {
  namespaced: true,
  state: {
    authData: null,
    playingTrack: null,
    playing: null,
    progress: 0,
    playingTrackPullInterval: 5000,
  },
  mutations: {
    setPlaying (state, playing) {
      state.playing = playing
    },
    setProgress (state, progress) {
      state.progress = progress
    },
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
    login ({ commit, dispatch, rootState }) {
      const scopes = keys.spotify.scopes.join(' ')
      const theURL = 'https://accounts.spotify.com/authorize?' +
        'response_type=code&' +
        `client_id=${keys.spotify.client_id}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(configs.api_url + '/spotify/auth')}`
      const newWindow = window.open(theURL, 'spotify-login', 'height=500,width=700')
      if (window.focus) newWindow.focus()

      function spotifyLoginCallback (event) {
        if (event.origin !== configs.api_host) {
          return
        }
        window.removeEventListener('message', spotifyLoginCallback, false)
        auth.signInWithCustomToken(event.data.token)
        commit('createAuthData', event.data.spotify)
      }
      window.addEventListener('message', spotifyLoginCallback, false)
    },
    pullCurrentPlayback ({ commit, getters, dispatch, state, rootState }) {
      getters.client.then(client => {
        client.get('/me/player/currently-playing', {}).then(response => {
          const firebaseUpdate = {}
          if (!state.playingTrack || (response.data.item.id !== state.playingTrack.id)) {
            commit('updatePlayingTrack', response.data.item)
            firebaseUpdate.playingTrack = response.data.item
          }
          commit('setPlaying', response.data.is_playing)
          firebaseUpdate.playing = response.data.is_playing
          commit('setProgress', response.data.progress_ms)
          firebaseUpdate.playingProgress = response.data.progress_ms

          if (rootState.eventID) {
            db.collection('events').doc(rootState.eventID).update(firebaseUpdate)
          }
          if (state.playingTrackPullInterval === null) {
            return
          }
          setTimeout(() => {
            dispatch('pullCurrentPlayback')
          }, state.playingTrackPullInterval)
        })
      })
    }
  },
  getters: {
    client (state, getters, rootState) {
      if (state.authData) {
        client.defaults.headers['Authorization'] = state.authData['token_type'] + ' ' + state.authData['access_token']
        return Promise.resolve(client)
      } else if (rootState.eventID) {
        return db.collection('events').doc(rootState.eventID).get()
          .then(doc => {
            if (doc.exists) {
              client.defaults.headers['Authorization'] = 'Bearer ' + doc.data().hostToken
            }
            return client
          })
      }
      return Promise.resolve(client)
    }
  },
}
