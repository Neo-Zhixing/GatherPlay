<template>
 <v-container id="event-container">
   <v-layout v-if="doc" row wrap id="event-layout">
     <v-flex sm9 xs12>
        <playlist :list="doc.playlist" :event="$route.params.event_id"/>
     </v-flex>
     <v-flex sm3 xs12>a</v-flex>
   </v-layout>
   <v-layout v-else-if="doc === false">
     No exist
   </v-layout>
   <v-layout v-else>
     Loading
   </v-layout>
 </v-container>
</template>


<script>
import { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
export default {
  name: 'event',
  components: {
    Playlist,
  },
  data () {
    return {
      doc: null,
    }
  },
  mounted () {
    const docRef = db.collection('events').doc(this.$route.params.event_id)
    docRef.get()
      .then(doc => {
        if (doc.exists) {
          this.doc = doc.data()
        } else {
          this.doc = false
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
