<template>
  <v-list-group
    v-if="user"
    lazy
    no-action
  >
    <v-list-tile
      slot="activator"
      avatar>
      <v-list-tile-avatar>
        <img :src="user.photoURL" />
      </v-list-tile-avatar>
      <v-list-tile-content>
        <v-list-tile-title v-text="user.displayName"/>
      </v-list-tile-content>
    </v-list-tile>
    <v-list-tile avatar @click="logout">
      <v-list-tile-avatar>
        <v-icon>exit_to_app</v-icon>
      </v-list-tile-avatar>
      <v-list-tile-content>
        <v-list-tile-title>Logout</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
  </v-list-group>
  <v-progress-circular indeterminate v-else-if="loading"/>
  <v-dialog
    lazy
    v-else
    width="500"
  >
    <v-list-tile
      slot="activator"
      avatar>
      <v-list-tile-avatar>
        <v-icon>input</v-icon>
      </v-list-tile-avatar>
      <v-list-tile-content>
        <v-list-tile-title>Login</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
    <v-card>
      <v-card-text>
        <user-login/>
      </v-card-text>
    </v-card>

  </v-dialog>
</template>

<script>
import firebase from '@/plugins/firebase'
import UserLogin from './UserLogin'
export default {
  name: 'UserStatusTiles',
  components: {
    UserLogin,
  },
  data () {
    return {
      user: null,
      loading: true,
    }
  },
  mounted () {
    firebase.auth().onAuthStateChanged((user) => {
      this.loading = false
      this.user = user
    })
  },
  methods: {
    logout () {
      this.loading = true
      return firebase.auth().signOut()
    },
  },
}
</script>
