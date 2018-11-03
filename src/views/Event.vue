<template lang="pug">
 v-container: v-layout(row wrap v-if="doc")
     v-flex(md8 xs12)
        playlist(:list="doc.playlist" :event="$route.params.event_id" :playing="doc.playingTrack")
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
  beforeRouteEnter (to, from, next) {
    db.collection('events').doc(to.params['event_id'])
      .get()
      .then(doc => {
        if (doc.exists) {
          next(vm => vm.doc = doc.data())
        } else {
          next(false)
        }
      })
      .catch(error => {
        next(error)
      })
  },
  beforeRouteUpdate (to, from, next) {
    this.doc = null
    db.collection('events').doc(to.params['event_id'])
      .get()
      .then(doc => {
        if (doc.exists) {
          this.doc = doc.data()
          next()
        } else {
          next(false)
        }
      })
      .catch(error => {
        next(error)
      })
  },
  mounted () {

  },
  watch: {
    doc (doc) {
      if (!doc) {
        return
      }
      this.$store.commit('updateTitle', doc.name)
    },
  },
}
</script>
