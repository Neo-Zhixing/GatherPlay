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
    this.synchronizer.onDeviceID = id => {
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
    event (event) {
      if (!event) {
        return
      }
      this.$store.commit('updateTitle', event.name)
      if (!event.playlistID && !this.creatingPlaylist) {
        /*
        BUG WARNING: async problem
        While we're requesting to create a new playlist, there might be a new document change coming in.
        This would create duplicated playlist.
        Workaround is creating a flag, this.creatingPlaylist.
        Needs better solution.
        */
        this.creatingPlaylist = true
        this.provider.createPlaylist({
          name:'GatherPlay - ' + event.name,
          public: false,
          description: 'Buffer playlist automatically created by GatherPlay'
        }).then(playlist => this.document.update({ playlistID: playlist.id }))
          .then(() => this.creatingPlaylist = false)
        return
      }
      console.log('updating the playlist')
      this.provider.updatePlaylist(event.playlistID, event.playlist)
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
