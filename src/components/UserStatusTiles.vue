<template lang="pug">
  v-list-group(v-if="user" lazy no-action)
    v-list-tile(slot="activator" avatar)
      v-list-tile-avatar
        img(:src='user.photoURL')
      v-list-tile-content
        v-list-tile-title(v-text="user.displayName")
    v-list-tile(avatar)
      v-list-tile-avatar
        v-icon event_seat
      v-list-tile-content
        v-list-tile-title My Events
    v-list-tile(avatar)
      v-list-tile-avatar
        v-icon settings
      v-list-tile-content
        v-list-tile-title Settings
    v-list-tile(avatar @click='logout')
      v-list-tile-avatar
        v-icon exit_to_app
      v-list-tile-content
        v-list-tile-title Logout
  v-dialog(v-else lazy width="500")
    v-list-tile(slot="activator" avatar)
      v-list-tile-avatar
        v-icon input
      v-list-tile-content
        v-list-tile-title Login
    v-card
      v-card-text
        user-login
</template>

<script>
import { auth } from '@/plugins/firebase'
import UserLogin from './UserLogin'
import { mapState } from 'vuex'
export default {
  name: 'UserStatusTiles',
  components: {
    UserLogin,
  },
  methods: {
    logout () {
      auth.signOut()
    },
  },
  computed: mapState({
    user: state => state.user
  })
}
</script>
