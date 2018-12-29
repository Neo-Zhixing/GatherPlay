import { auth, client } from '@/plugins/firebase'
import SpotifyProvider from '@/providers/spotify'
import { VuexStoreCache, VuexStoreKey } from '@/utils/cache'

export default function (store) {
  const provider = new SpotifyProvider(
    new VuexStoreCache(
      store,
      'spotify/accessToken',
      'spotify/accessTokenExpires',
      'spotify/updateToken',
      'spotify/updateTokenExpires',
    ),
    new VuexStoreKey(
      store,
      'spotify/profile',
      'spotify/updateProfile'
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
      profile: null,
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
      updateProfile (state, profile) {
        state.profile = profile
      }
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
