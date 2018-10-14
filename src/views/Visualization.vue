<template>
  <v-container fluid fill-height pa-0 ma-0 overflow-hidden>
    <v-layout column>
      <canvas id="kaleidoscope" ref="visual-canvas" style="display: none;"></canvas>
      <v-layout row id="visualization-container" ref="visual">
      </v-layout>
      <v-layout wrap row align-center justify-end id="visualization-button">
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
              color="orange" text-color="white"
            >
              Create An Event
            </v-chip>
          </v-menu>
          <v-chip
            v-else
            slot="activator"
            color="green" text-color="white" @click="login"
          >
            Sign In
          </v-chip>
          <v-chip
            v-if="playingTrack" color="blue" text-color="white">
                  {{ playingTrack.item.name }}
          </v-chip>
      </v-layout>

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
    visualizationDrawer(this.$refs['visual'], this.$refs['visual-canvas'])
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
    width: 100%;
    height:100%;
  }
  #visualization-button {
    height:0;
    overflow: visible;
    margin-top: -69pt;
  }
</style>
