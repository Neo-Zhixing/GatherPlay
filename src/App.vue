<template lang="pug">
  v-app
    v-navigation-drawer(
      persistent
      v-model="drawer"
      enable-resize-watcher
      clipped
      fixed
      app
    )
      v-list
        user-status-tiles
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
        router-view(name="nav")
    v-toolbar(
      app
      clipped-left
    )
      v-toolbar-side-icon(@click.stop="drawer = !drawer")
      v-toolbar-title Gather Play
    v-content: router-view
    v-footer(fixed app)
      span &copy; 2018
</template>

<script>
import UserStatusTiles from './components/UserStatusTiles'
export default {
  name: 'App',
  components: {
    UserStatusTiles
  },
  data () {
    return {
      drawer: false,
    }
  },
}
</script>
