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
        <!--
          notSignedIn needs to be modified
        -->
          <v-menu v-if="signedIn" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
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
            v-if="signedIn" color="blue" text-color="white">
            {{ current }}
          </v-chip>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
import visualizationDrawer from '@/visualizations'
export default {
  name: 'Visualization',
  data () {
    return {
      current: 'Loading...',
      signedIn: true,
    }
  },
  mounted () {
    visualizationDrawer(this.$refs['visual'])
    const client = this.$store.getters['spotify/client']
    client.get('https://api.spotify.com/v1/me/player/currently-playing', {}).then(response => {
      if (response) {
        this.current = 'Now Playing:' + response.data.item.name + ' - ' + response.data.item.artists[0].name + ', album: ' +
          response.data.item.album.name
      }
    })
  },
  methods: {
    login () {
      this.$store.dispatch('spotify/login')
    }
  }
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
