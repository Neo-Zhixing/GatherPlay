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
        <!--
          notSignedIn needs to be modified
        -->
          <v-menu v-if="notSignedIn" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-chip
              slot="activator"
              color="orange" text-color="white"
            >
              Sign In
            </v-chip>
          </v-menu>
          <v-menu v-else pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-chip
              slot="activator"
              color="green" text-color="white"
            >
              Create An Event
            </v-chip>
          </v-menu>
        <v-flex xs-12 xm-4 offset-xs0 offset-xm 6>
          <v-chip color="blue" text-color="white">
            {{ current }}
          </v-chip>
        </v-flex>
      </v-layout>
  </v-container>
</template>

<script>
import visualizationDrawer from '@/visualizations'
export default {
  name: 'Visualization',
  data () {
    return {
      current: 'aefhaief'
    }
  },
  mounted () {
    visualizationDrawer(this.$el)
    this.current = 'kkk'
    const client = this.$store.getters['spotify/client']
    client.get('https://api.spotify.com/v1/me/player/currently-playing',{}).then(response => {
      if (response) {
        console.log('FUCK2')
        this.current = 'Now Playing:' + response.data.item.name + ' - ' + response.data.item.artists[0].name + ', album: ' +
          response.data.item.album.name
      }
    })
    console.log('FUCK3')
  }
}
</script>

<style scoped>
  #visualization-container {
    height: 100%;
    width: 100%;
    background-color: aqua;
  }
</style>
