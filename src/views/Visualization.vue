<template>
  <v-container fluid fill-height pa-0 ma-0 overflow-hidden>
    <v-layout column>
      <v-layout row id="visualization-container" ref="visual">
      </v-layout>
      <v-layout wrap row align-center justify-end id="visualization-button">
          <v-menu pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-chip
              slot="activator"
              color="primary" text-color="white"
            >
              Join An Event
            </v-chip>
            <v-card>
              <v-card-text>
                Join an event
                <v-layout row>
                  <v-text-field
                    placeholder="Party ID"
                  ></v-text-field>

                  <v-chip
                    color = "primary" text-color="white"
                  >Join</v-chip>
                </v-layout>
              </v-card-text>
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
export default {
  name: 'Visualization',
  data () {
    return {
    }
  },
  mounted () {
    visualizationDrawer(this.$refs['visual'])
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
  },
  computed: {
    ...mapState({
      user: state => state.user,
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
