<template>
  <v-container fill-height pa-0 style="background-color: blue">
    <div id="visualization-container">
    </div>
    <v-layout row align-end >
      <v-menu pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
        <v-btn
          slot="activator"
          color="primary" text-color="white"
        >
          Join An Event
        </v-btn>
        <v-card>
          <v-card-title>Join an event</v-card-title>
          <v-card-text>
              <v-text-field
                placeholder="Party ID"
                v-model="joinEvent"
              ></v-text-field>
              <v-text-field
                placeholder="Your Name"
                v-model="joinEventUsername"
              ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn flat @click="joinEventAnonymous"
                   color = "primary" text-color="white"
                   :disabled = "joinEvent == '' || joinEventUsername == ''"
            >Join</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
      <v-menu v-if="user" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
        <v-chip
          slot="activator"
          color="green" text-color="white"
        >
          Create An Event
        </v-chip>
      </v-menu>
      <v-menu v-else pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
        <v-chip
          @click="login"
          slot="activator"
          color="orange" text-color="white"
        >
          Sign In
        </v-chip>
      </v-menu>
      <v-flex v-if="playingTrack" xs-12 xm-4 offset-xs0 offset-xm 6>
        <v-chip color="blue" text-color="white">
          {{playingTrack.item.name}}
        </v-chip>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import visualizationDrawer from '@/visualizations'
import { db, auth } from '@/plugins/firebase'
export default {
  name: 'Visualization',
  data () {
    return {
      joinEvent: '',
      joinEventUsername: '',
    }
  },
  mounted () {
    visualizationDrawer(this.$el)
    if (this.$store.state.eventID === null) {
      this.$store.commit('spotify/setPlayingTrackPullInterval', 5000)
      this.$store.dispatch('spotify/pullCurrentPlayback')
    } else {
      this.$store.commit('spotify/setPlayingTrackPullInterval', null)
    }
  },
  methods: {
    ...mapActions({
      login: 'spotify/login',
    }),
    joinEventAnonymous () {
      db.collection('events').doc(this.joinEvent).get()
        .then(doc => {
          if (!doc.exists) {
            this.joinEvent = ''
            return
          }
          auth.signInAnonymously().then(response => {
            return response.user.updateProfile({
              displayName: this.joinEventUsername,
            })
          }).then(() => {
            this.$router.push({ name: 'event', params: { event_id: this.joinEvent } })
          })
        })
    },
  },
  computed: {
    ...mapState({
      user: state => state.user,
      event: state => state.eventID,
      playingTrack: state => state.spotify.playingTrack,
    })
  },
}
</script>

<style scoped>
  #visualization-container {
    height: 100%;
    width: 100%;
    background-color: aqua;
  }
</style>
