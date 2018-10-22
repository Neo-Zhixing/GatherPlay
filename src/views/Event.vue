<template>
 <v-container id="event-container">
   <v-layout v-if="loading" align-center justify-center column fill-height>
     <!--Loading screen-->
     <v-spacer></v-spacer>
     <LoadingScreen></LoadingScreen>
   </v-layout>
   <v-layout v-else-if="doc" row wrap id="event-layout">
     <v-flex sm12 xs12>
        <playlist :list="doc.playlist" :event="$route.params.event_id" :playing="doc.playingTrack"/>
     </v-flex>
   </v-layout>
   <v-layout v-else align-center justify-center column fill-height>
     <!--Error page-->
     <PageNotFound></PageNotFound>
   </v-layout>

 </v-container>
</template>

<script>
import firebase, { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
import { mapState } from 'vuex'
import PageNotFound from '../components/PageNotFound'
import LoadingScreen from '../components/LoadingScreen'
export default {
  name: 'event',
  components: {
    Playlist,
    PageNotFound,
    LoadingScreen
  },
  data () {
    return {
      loading: true,
      doc: null,
    }
  },
  mounted () {
    console.log('ddd')
  },
  computed: {
  },
  watch: {
  }
}
</script>

<style scoped>
#event-container, #event-layout {
  height: 100%;
  width: 100%;
}
</style>
