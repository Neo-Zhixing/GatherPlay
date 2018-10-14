<template>
  <v-container fluid fill-height pa-0 ma-0 overflow-hidden>
    <v-layout column>
      <canvas id="kaleidoscope" ref="visual-canvas" style="display: none;"></canvas>
      <v-layout row id="visualization-container" ref="visual">
      </v-layout>
      <v-layout wrap row align-center justify-end id="visualization-button">
        <v-btn color="primary" v-if="event" @click="exitEvent">Exit {{event}}</v-btn>
        <v-menu v-else pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
          <v-btn
            slot="activator"
            color="primary" text-color="white"
          >
            Join An Event
          </v-btn>
          <v-card>
            <v-card-title>Join event</v-card-title>
            <v-card-text>
              <v-text-field
                placeholder="Party ID"
                v-model="joinEvent"
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn flat @click="joinEventAnonymous"
                     color="primary" text-color="white"
                     :disabled="joinEvent === ''"
              >Join
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <v-menu v-if="spotifyAuthState" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
          <v-btn
            slot="activator"
            color="orange" text-color="white"
          >
            Create Event
          </v-btn>
        </v-menu>
        <v-btn
          v-else
          slot="activator"
          color="green" text-color="white" @click="login"
        >
          <img src="@/assets/spotify-logo.svg" height="20"/> <span class="white-text">Sign in with Spotify</span>
        </v-btn>
        <v-btn v-if="user || spotifyAuthState" @click="signout">Sign Out</v-btn>
        <v-chip
          v-if="playingTrack" color="blue" text-color="white">
          {{ playingTrack.name }}
        </v-chip>
      </v-layout>

    </v-layout>
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import Visualizer from '@/visualizations'
import { db, auth } from '@/plugins/firebase'
import axios from 'axios'

export default {
  name: 'Visualization',
  data () {
    return {
      joinEvent: '',
      visualizer: null,
      hello: 0,
      blockEvents: false,
    }
  },
  mounted () {
    this.visualizer = new Visualizer(this.$refs['visual'], this.$refs['visual-canvas'])
    this.updateProvider()

    console.log(this.user)
    if (this.user){
      console.log(this.user.isAnonymous)
    }

    this.visualizer.init(this.user)

    console.log(this.event)
  },
  methods: {
    updateProvider () {
      if (this.event || this.spotifyAuthState || this.user) {
        this.$store.commit('spotify/setPlayingTrackPullInterval', 5000)
        this.$store.dispatch('spotify/pullCurrentPlayback')
      } else {
        this.$store.commit('spotify/setPlayingTrackPullInterval', null)
      }
    },
    signout () {
      auth.signOut()
      this.$store.commit('spotify/createAuthData', null)
      this.updateProvider()
    },
    exitEvent() {
      this.$store.commit('changeEvent', null)
      this.updateProvider()
    },
    ...mapActions({
      login: 'spotify/login',
    }),
    joinEventAnonymous () {
      db.collection('events').doc(this.joinEvent).get()
        .then(doc => {
          if (!doc.exists) {
            this.joinEvent = ''
            return
          }
          auth.signInAnonymously().then(() => {
            this.$router.push({ name: 'event', params: { event_id: this.joinEvent } })
          })
        })
    },
    loadVisualization () {

      if (false) {
        Promise.all([
          axios.get("/test.json"),
          axios.get("/test.lrc")
        ]).then(([analysisResponse, lyricsResponse]) => {
          this.visualizer.load(analysisResponse.data, lyricsResponse.data, 78000)
        })

        return
      }

      if (this.blockEvents) {
        console.log('Visualization Loading Blocked')
        return
      }
      this.blockEvents = true
      setTimeout(() => {
        this.blockEvents = false
      }, 500)
      console.log('Loading Visualization..', this.playing)
      if (!this.playing) {
        this.visualizer.load()
        return
      }

      const t0 = performance.now()
      this.$store.getters['spotify/client'].then(client => {
        return Promise.all([
          client.get(`/audio-analysis/${this.playingTrack.id}`),
          axios.get(`https://api.imjad.cn/cloudmusic/?type=search&search_type=1&s=${this.playingTrack.name + ' ' + this.playingTrack.artists.map(artist => artist.name).join(' ')}`)
            .then(response => {
              const id = response.data.result.songs[0].id
              return axios.get(`https://api.imjad.cn/cloudmusic/?type=lyric&id=${id}`)
            })
        ])
      }).then(([analysisResponse, lyricsResponse]) => {
        const t1 = performance.now()
        let lyrics = null
        if (lyricsResponse.data.lrc && lyricsResponse.data.lrc.lyric) {
          lyrics = lyricsResponse.data.lrc.lyric
        }
        this.visualizer.load(analysisResponse.data, lyrics, this.playingProgress + (t1 - t0), this.playingTrack.album.images[0].url, this.playingTrack.name + ' - ' + this.playingTrack.artists[0])
      })
    }
  },
  computed: {
    ...mapState({
      user: state => state.user,
      event: state => state.eventID,
      playingTrack: state => state.spotify.playingTrack,
      playing: state => state.spotify.playing,
      playingProgress: state => state.spotify.progress,
      spotifyAuthState: state => state.spotify.authData,
    })
  },
  watch: {
    playingTrack () {
      this.loadVisualization()
    },
    playing () {
      this.loadVisualization()
    }
  }
}
</script>

<style scoped>
  #visualization-container {
    width: 100%;
    height: 100%;
  }

  #visualization-button {
    height: 0;
    overflow: visible;
    margin-top: -69pt;
  }

  .white-text {
    color: white;
    padding-left: 8px;
  }
</style>
