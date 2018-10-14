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
      authData: state.spotify.authData,
    }
  }),
})

Vue.use(Vuex)

auth.onAuthStateChanged(user => {
  store.commit('changeAuthState', user)
})

const store = new Vuex.Store({
  state: {
    user: auth.currentUser,
    eventID: null,
  },
  mutations: {
    changeAuthState (state, user) {
      state.user = user
    },
    changeEvent (state, id) {
      state.eventID = id
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
export default store
