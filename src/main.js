import Vue from 'vue'
import '@/plugins/vuetify'
import '@/plugins/firebase'
import App from './App.vue'
import router from './router'
import store from './store'
import config from './keys.json'
import './registerServiceWorker'

import 'vue-googlemaps/dist/vue-googlemaps.css'
import VueGoogleMaps from 'vue-googlemaps'

Vue.config.productionTip = false

Vue.use(VueGoogleMaps, {
  load: {
    // Google API key
    apiKey: config.firebase.apiKey,
    // Enable more Google Maps libraries here
    // libraries: ['places'],
    // Use new renderer
    useBetaRenderer: true,
  },
})

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
