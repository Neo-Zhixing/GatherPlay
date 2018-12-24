<template lang="pug">
 v-container: v-layout(row wrap v-if="doc")
     v-flex(md8 xs12)
        playlist(
          :list="doc.playlist"
          :playing="doc.playingTrack"
          @remove="removeTrack"
          @add="addTrack"
          @skip="skip"
        )
</template>

<script>
import { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
import SpotifyPullSynchronizer from '@/synchronizers/SpotifyPull'
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
    this.firebaseUnsubscribe = this.document.onSnapshot(doc => this.doc = doc.data())
    this.synchronizer = new SpotifyPullSynchronizer(this.provider)
    this.synchronizer.delegate = this
    this.synchronizer.start()
  },
  beforeDestroy () {
    if (this.firebaseUnsubscribe) this.firebaseUnsubscribe()
  },
  methods: {
    skip () {
      // TODO
    },
    addTrack (track) {
      // TODO Simplify the information saved in db
      track.proposer = this.user.uid
      this.document.update({
        playlist: firebase.firestore.FieldValue.arrayUnion(track)
      })
    },
    removeTrack (track) {
      this.document.update({
        playlist: firebase.firestore.FieldValue.arrayRemove(track)
      })
    },
    load(track, progress, playing) {
      // TODO Simplify the information saved in db
      // TODO Move the entire thing based on websocket.
      console.log('Load new song and write to db', track)
      if (!track) {
        // Nothing is playing
        this.document.update({
          playingTrack: null,
          playbackProgress: null,
          playing: false,
        })
        return
      }
      this.document.update({
        playingTrack: track,
        playbackProgress: progress,
        playing: playing,
      })
    },
    seek (progress, playing) {
      console.log('Write to db,', progress)
      this.document.update({
        playbackProgress: progress,
        playing: playing
      })
    },
  },
  watch: {
    doc (doc) {
      if (!doc) {
        return
      }
      this.$store.commit('updateTitle', doc.name)
    },
  },
  computed: {
    event () {
      return this.$route.params.event_id
    },
    document () {
      return db.collection('events').doc(this.event)
    },
    user () {
      return this.$store.state.user
    },
    provider () {
      return this.$store.getters['spotify/provider']
    },
  },
}
</script>
