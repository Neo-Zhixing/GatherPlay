<template>
  <v-container fill-height pa-0 style="background-color: blue">
    <div id="visualization-container">
    </div>
    <v-layout row align-end >
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
export default {
  name: 'Visualization',
  data () {
    return {
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
    height: 100%;
    width: 100%;
    background-color: aqua;
  }
</style>
