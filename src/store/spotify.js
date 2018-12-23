import { auth, client } from '@/plugins/firebase'
import SpotifyProvider from '@/providers/spotify'
import { VuexStoreCache } from '@/utils/cache'

export default function (store) {
  const provider = new SpotifyProvider(
    new VuexStoreCache(
      store,
      'spotify/accessToken',
      'spotify/accessTokenExpires',
      'spotify/updateToken',
      'spotify/updateTokenExpires',
    ),
    client,
  )
  auth.onAuthStateChanged(user => {
    if (!user) {
      store.commit('spotify/updateAuth', false)
    }
  })
  return {
    namespaced: true,
    state: {
      accessToken: null,
      accessTokenExpires: null, // The timestamp at which the token expires
    },
    mutations: {
      updateToken (state, token) {
        state.accessToken = token
      },
      updateTokenExpires (state, expires) {
        state.accessTokenExpires = expires
      },
    },
    actions: {
      login ({ getters }) {
        return provider.login()
          .then(data => {
            auth.signInWithCustomToken(data.token)
            getters.provider.accessKey.set(data.spotify.access_token, data.spotify.expires_in)
          })
      },
    },
    getters: {
      provider () {
        return provider
      }
    }
  }
}
