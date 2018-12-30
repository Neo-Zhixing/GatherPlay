<template lang="pug">
  v-container: v-layout(row wrap v-if="event")
    v-flex(md2 md3 sm4 xs12)
      playback(
        :track="event.playingTrack"
        :playing="event.playing"
        @skip="skip"
        @pause="toggle(false)"
        @resume="toggle(true)"
      )
    v-flex(md8 xs12): v-card
      v-card-title(primary-title): h3(class="headline") Playlist
      v-card-text
        playlist(
          :list="event.playlist"
          :playing="event.playingTrack"
          @remove="removeTrack"
        )
        music-input(@add="addTrack")
</template>

<script>
import { db } from '@/plugins/firebase'
import Playlist from '@/components/Playlist.vue'
import MusicInput from '@/components/MusicInput.vue'
import Playback from '@/components/Playback.vue'
import SpotifyPullSynchronizer from '@/synchronizers/SpotifyPull'
import SpotifyWebPlayerProvider from '@/synchronizers/SpotifyWebPlayer'

export default {
  name: 'event',
  components: {
    Playlist,
    MusicInput,
    Playback,
  },
  data () {
    return {
      event: null,
    }
  },
  beforeRouteEnter (to, from, next) {
    console.log('start entering')
    db.collection('events').doc(to.params['event_id'])
      .get()
      .then(doc => {
        console.log('end entering')
        if (doc.exists) {
          next(vm => vm.event = doc.data())
        } else {
          next(false)
        }
      })
      .catch(error => {
        next(error)
      })
  },
  beforeRouteUpdate (to, from, next) {
    this.event = null
    db.collection('events').doc(to.params['event_id'])
      .get()
      .then(doc => {
        if (doc.exists) {
          this.event = doc.data()
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
    this.firebaseUnsubscribe = this.document.onSnapshot(doc => this.event = doc.data())
    // this.synchronizer = new SpotifyPullSynchronizer(this.provider)
    this.synchronizer = new SpotifyWebPlayerProvider(this.provider)
    this.synchronizer.delegate = this
    this.synchronizer.onready = (ready, id) => {
      this.provider.deviceID = id
    }
    this.synchronizer.start()

  },
  beforeDestroy () {
    if (this.firebaseUnsubscribe) this.firebaseUnsubscribe()
  },
  methods: {
    skip () {
      this.synchronizer.player.nextTrack()
    },
    toggle (play) {
      if (play) {
        this.synchronizer.player.resume()
      } else {
        this.synchronizer.player.pause()
      }
    },
    addTrack (track) {
      // TODO Simplify the information saved in db
      track.proposer = this.user.uid
      return this.document.update({
        playlist: firebase.firestore.FieldValue.arrayUnion(track)
      })
    },
    removeTrack (track) {
      return this.document.update({
        playlist: firebase.firestore.FieldValue.arrayRemove(track)
      })
    },
    load(track) {
      // TODO Simplify the information saved in db
      // TODO Move the entire thing based on websocket.
      // TODO Because of the lack of Spotify Queue API, we're doing a workaround here.
      // Check the status of the playback; push the next one when it's different from expected
      console.log('loading')
      if (!track || !this.event.playingTrack || track.uri !== this.event.playingTrack.uri) {
        console.log('different from expected')
        if (this.event.playlist.length <= 0) {
          console.log('no next song. no other music in the playlist.')
          this.document.update({
            playingTrack: null,
            playbackProgress: null,
            playing: false,
          })
          return
        }
        const nextTrack = this.event.playlist[0]
        console.log(track && track.uri, nextTrack.uri)
        if (track && (track.uri === nextTrack.uri)) {
          // Already start playing the next song.
          console.log('updating db')
          this.document.update({
            playlist: firebase.firestore.FieldValue.arrayRemove(nextTrack),
            playingTrack: nextTrack
          })
        } else {
          console.log('push the music')
          this.provider.playTrack(this.event.playlist[0])
        }
      }
    },
    seek () {
      console.log('seeking')
    }
  },
  watch: {
    event (event, oldEvent) {
      if (!event) {
        return
      }
      this.$store.commit('updateTitle', event.name)
    },
  },
  computed: {
    eventID () {
      return this.$route.params.event_id
    },
    document () {
      return db.collection('events').doc(this.eventID)
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
