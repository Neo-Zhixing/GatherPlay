import keys from '@/keys.json'
import firebase from '@/plugins/firebase'

export default {
  namespaced: true,
  state: {
    authData: null,
  },
  mutations: {
    createAuthData (data) {
      this.authData = data
    }
  },
  actions: {
    login ({ commit }) {
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
  },
  getters: {},
}
