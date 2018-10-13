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
import firebase, { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
import { mapState } from 'vuex'
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
          return
        }
        this.$store.commit('changeEvent', this.$route.params.event_id)
        if (this.doc.host === this.user.uid) {
          this.$store.commit('spotify/setPlayingTrackPullInterval', 5000)
          this.$store.dispatch('spotify/pullCurrentPlayback')
        } else {
          this.$store.commit('spotify/setPlayingTrackPullInterval', null)
        }
      })
    docRef
      .onSnapshot(doc => {
        this.doc = doc.data()
      })
  },
  computed: {
    ...mapState({
      playingTrack: state => state.spotify.playingTrack,
      user: state => state.user,
    })
  },
  watch: {
    playingTrack () {
      if (!this.doc || this.doc.playlist.length == 0) {
        return
      }
      console.log(!this.playingTrack.is_playing)
      if (!this.playingTrack.is_playing) {
        // Request new song
        console.log('Requesting new song')
        const client = this.$store.getters['spotify/client']
        client.put('/me/player/play', {
          uris: [this.doc.playlist[0].uri]
        }).then(() => {
          return db.collection('events').doc(this.$route.params.event_id).update({
            playlist: firebase.firestore.FieldValue.arrayRemove(this.doc.playlist[0])
          })
        })
      }
    }
  }
}
</script>

<style scoped>
#event-container, #event-layout {
  height: 100%;
  width: 100%;
}
</style>
