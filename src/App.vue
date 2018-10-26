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
        main-nav-drawer
        router-view(name="nav")
    v-toolbar(
      app
      clipped-left
    )
      v-toolbar-side-icon(@click.stop="drawer = !drawer")
      v-toolbar-title Gather Play
      v-spacer
      v-text-field(
        flat
        label="Search"
        prepend-inner-icon="search"
        solo-inverted
        hide-details
        single-line
      )
    v-content: router-view
    v-footer(fixed app)
      span &copy; 2018
</template>

<script>
import MainNavDrawer from '@/components/MainNavDrawer'
export default {
  name: 'App',
  components: {
    MainNavDrawer,
  },
  data () {
    return {
      drawer: false,
    }
  },
}
</script>
