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
    const docRef = db.collection('events').doc(this.$route.params.event_id)
    docRef.get()
      .then(doc => {
        if (!doc.exists) {
          this.loading = false
          return
        }
        this.$store.commit('changeEvent', this.$route.params.event_id)
        if (!this.user) {
          this.$router.replace('/')
          return
        }
        this.doc = doc.data()
        this.loading = false
      })
    docRef
      .onSnapshot(doc => {
        this.doc = doc.data()
      })
  },
  computed: {
    ...mapState({
      playingTrack: state => state.spotify.playingTrack,
      playing: state => state.spotify.playing,
      user: state => state.user,
    }),
    host () {
      const hostornot = this.user && this.doc.host === this.user.uid
      console.log('AM I THE HOST?', this.user.uid)
      return hostornot
    }
  },
  watch: {
    playing () {
      if (!this.doc || this.doc.playlist.length == 0) {
        return
      }
      if (this.playing) {
        return
      }
      console.log('Requesting new song')
      this.$store.getters['spotify/client']
        .then(client => {
          return client.put('/me/player/play', {
            uris: [this.doc.playlist[0].uri]
          })
        })
        .then(() => {
          return db.collection('events').doc(this.$route.params.event_id).update({
            playlist: firebase.firestore.FieldValue.arrayRemove(this.doc.playlist[0]),
          })
        })
    },
  }
}
</script>

<style scoped>
#event-container, #event-layout {
  height: 100%;
  width: 100%;
}
</style>
