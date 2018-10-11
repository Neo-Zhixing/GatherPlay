import Vue from 'vue'
import Vuex from 'vuex'

import spotify from './spotify'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    spotify: spotify,
  }
})
