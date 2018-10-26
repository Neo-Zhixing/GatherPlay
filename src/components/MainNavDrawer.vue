<template lang="pug">
  div
    v-dialog(lazy v-model="newEventDialog" max-width="600px")
      new-event-view(
        @created="created"
        @cancel="newEventDialog = false"
      )
    v-dialog(lazy v-model="loginDialog" max-width="400px")
      v-card
        v-card-text
          user-login
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
    v-list-tile(v-else avatar @click="loginDialog = true")
      v-list-tile-avatar
        v-icon input
      v-list-tile-content
        v-list-tile-title Login
    v-list-tile(avatar @click="newEventDialog = true")
      v-list-tile-avatar
        v-icon library_add
      v-list-tile-content
        v-list-tile-title Create New Event
    v-list-tile(avatar)
      v-list-tile-avatar
        v-icon near_me
      v-list-tile-content
        v-list-tile-title Events Nearby
    v-list-tile(avatar href="https://lyricly.me")
      v-list-tile-avatar
        v-icon equalizer
      v-list-tile-content
        v-list-tile-title Lyricly
</template>

<script>
import { auth } from '@/plugins/firebase'
import UserLogin from './UserLogin'
import { mapState } from 'vuex'
import NewEventView from '@/views/NewEvent'
export default {
  name: 'MainNavDrawer',
  components: {
    NewEventView,
    UserLogin,
  },
  data () {
    return {
      newEventDialog: false,
      loginDialog: false,
    }
  },
  methods: {
    logout () {
      auth.signOut()
    },
    created (eventID) {
      this.newEventDialog = false
      this.$router.push({ name: 'event', params: { event_id: eventID }})
    },
  },
  computed: mapState({
    user: state => state.user
  })
}
</script>

<style scoped>

</style>
