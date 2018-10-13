import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

import { auth } from '@/plugins/firebase'
import spotify from './spotify'

const vuexLocal = new VuexPersistence({
  storage: window.localStorage
})

Vue.use(Vuex)

auth.onAuthStateChanged(user => {
  store.commit('changeAuthState', user)
})

const store = new Vuex.Store({
  state: {
    user: null,
  },
  mutations: {
    changeAuthState (state, user) {
      state.user = user
    }
  },
  modules: {
    spotify: spotify,
  },
  plugins: [
    vuexLocal.plugin,
  ],
})
export default store
