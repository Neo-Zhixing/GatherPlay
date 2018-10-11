<template>
  <div ref="auth-container">
    <v-progress-circular intermediate v-if="loading"/>
  </div>
</template>

<script>
import { UILoader } from '@/plugins/firebase'
export default {
  name: 'UserLogin',
  data () {
    return {
      loading: true,
    }
  },
  mounted () {
    UILoader
      .then(([ui, firebase]) => {
        const uiConfig = {
          callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
              // User successfully signed in.
              // Return type determines whether we continue the redirect automatically
              // or whether we leave that to developer to handle.
              return true
            },
            uiShown: () => {
              this.loading = false
            },
          },
          // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
          signInFlow: 'popup',
          signInSuccessUrl: '#',
          signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.PhoneAuthProvider.PROVIDER_ID
          ],
          // Terms of service url.
          tosUrl: '#',
          // Privacy policy url.
          privacyPolicyUrl: '#'
        }
        ui.start(this.$refs['auth-container'], uiConfig)
      })
  },
}
</script>

<style scoped>
  @import "~firebaseui/dist/firebaseui.css";
</style>
