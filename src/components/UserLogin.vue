<template>
  <v-layout column>
    <button
      class="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-id-idp-button idp-spotify"
      @click.prevent="spotifyLogin">
      <span class="firebaseui-idp-icon-wrapper">
        <img class="firebaseui-idp-icon" src="@/assets/spotify-logo.svg"/>
      </span>
      <span class="firebaseui-idp-text firebaseui-idp-text-long">Sign in with Spotify</span>
      <span class="firebaseui-idp-text firebaseui-idp-text-short">Spotify</span>
    </button>
    <v-progress-circular intermediate v-if="loading"/>
  </v-layout>
</template>

<script>
import { LoadAuthUI } from '@/plugins/firebase'
export default {
  name: 'UserLogin',
  data () {
    return {
      loading: true,
    }
  },
  mounted () {
    LoadAuthUI(this.$el, this.uiShown)
      .then((authResult, redirectURL) => {
        console.log('Logged IN!!!')
      })
  },
  methods: {
    uiShown () {
      this.loading = false
    },
    spotifyLogin () {
      this.$store.dispatch('spotify/login')
        .then(() => {
          this.$emit('loggedIn')
        })
    },
  }
}
</script>

<style scoped>
  @import "~firebaseui/dist/firebaseui.css";
  .idp-spotify,
  .idp-spotify:hover,
  .mdl-button.idp-spotify:active,
  .mdl-button.idp-spotify:focus {
    background-color: #1DB954;
    margin-left: auto;
    margin-right: auto;
  }
</style>
