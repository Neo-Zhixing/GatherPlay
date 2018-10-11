<template>
  <v-app>
    <v-navigation-drawer
      persistent
      v-model="drawer"
      enable-resize-watcher
      clipped
      fixed
      app
    >
      <v-list>
        <user-status-tiles/>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      app
      clipped-left
    >
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title v-text="title"></v-toolbar-title>
    </v-toolbar>
    <v-content>
      <router-view/>
    </v-content>
    <v-footer fixed app>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script>
import UserStatusTiles from '@/components/UserStatusTiles'
export default {
  name: 'App',
  components: {
    UserStatusTiles
  },
  data () {
    return {
      drawer: true,
      items: [{
        icon: 'bubble_chart',
        title: 'Inspire'
      }],
      title: 'Gather Play'
    }
  }
}
</script>
