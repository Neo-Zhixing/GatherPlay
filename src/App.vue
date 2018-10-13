<template>
  <v-app>
    <v-content>
      <router-view/>
    </v-content>
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
