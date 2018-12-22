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
  },
  beforeDestroy () {
    if (this.firebaseUnsubscribe) this.firebaseUnsubscribe()
  },
  methods: {
    skip () {
      this.$store.getters['spotify/client']
        .then(client => {
          return client.put('/me/player/play', {
            uris: [this.list[0].uri]
          })
        })
        .then(() => {
          return this.document.update({
            playlist: firebase.firestore.FieldValue.arrayRemove(this.list[0]),
          })
        })
    },
    addTrack (track) {
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
  },
}
</script>
