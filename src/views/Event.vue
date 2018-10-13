<template>
 <v-container id="event-container">
   <v-layout v-if="loading" align-center justify-center column fill-height>
     <!--Loading screen-->
     <v-spacer></v-spacer>
     <LoadingScreen></LoadingScreen>
   </v-layout>
   <v-layout v-else-if="doc" row wrap id="event-layout">
     <v-flex sm9 xs12>
        <playlist :list="doc.playlist" :event="$route.params.event_id"/>
     </v-flex>
     <v-flex sm3 xs12>a</v-flex>
   </v-layout>
   <v-layout v-else align-center justify-center column fill-height>
     <!--Error page-->
     <PageNotFound></PageNotFound>
   </v-layout>

 </v-container>
</template>

<script>
import { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
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
    const docRef = db.collection('events').doc(this.$route.params.event_id)
    docRef.get()
      .then(doc => {
        this.loading = false
        if (doc.exists) {
          this.doc = doc.data()
        }
      })
    docRef
      .onSnapshot(doc => {
        this.doc = doc.data()
      })
  },
}
</script>

<style scoped>
#event-container, #event-layout {
  height: 100%;
  width: 100%;
}
</style>
