<template>
  <v-container fill-height pa-0 style="background-color: blue">
      <div id="visualization-container">
      </div>
      <v-layout row align-end >
          <v-menu pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-btn
              slot="activator"
              color="light"
              dark
            >
              Join An Event
            </v-btn>
            <v-card>
              <v-card-text>
                Join an event
                  <v-text-field
                    placeholder="Party ID"
                  ></v-text-field>
                  <v-btn>Join</v-btn>
              </v-card-text>
            </v-card>
          </v-menu>
        <!--
          notSignedIn needs to be modified
        -->
          <v-menu v-if="notSignedIn" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-btn
              slot="activator"
              color="light"
              dark
            >
              Sign In
            </v-btn>
          </v-menu>
          <v-menu v-else pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
            <v-btn
              slot="activator"
              color="light"
              dark
            >
              Create An Event
            </v-btn>
          </v-menu>
      </v-layout>
  </v-container>
</template>

<script>
import visualizationDrawer from '@/visualizations'
export default {
  name: 'Visualization',
  mounted () {
    visualizationDrawer(this.$el)
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
