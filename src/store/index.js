import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

import { auth } from '@/plugins/firebase'
import spotify from './spotify'

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: (state) => ({
    user: state.user,
    eventID: state.eventID,
    spotify: {
      authenticated: state.spotify.authenticated,
      accessToken: state.spotify.accessToken,
      accessTokenExpires: state.spotify.accessTokenExpires,
    },
  }),
})

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    user: auth.currentUser,
    title: 'Gather Play',
  },
  mutations: {
    changeAuthState (state, user) {
      state.user = user
    },
    updateTitle (state, title) {
      state.title = title
    }
  },
  actions: {
  },
  modules: {
    spotify: spotify,
  },
  plugins: [
    vuexLocal.plugin,
  ],
})

auth.onAuthStateChanged(user => {
  store.commit('changeAuthState', user)
})

export default store
