<template>
  <v-container fluid fill-height pa-0 ma-0 overflow-hidden>
    <v-layout column>
      <canvas id="kaleidoscope" ref="visual-canvas" style="display: none;"></canvas>
      <v-layout row id="visualization-container" ref="visual">
      </v-layout>
      <v-layout wrap row align-center justify-end id="visualization-button">
        <v-menu v-if="!event" pd-5 offset-y top :close-on-content-click="false" :nudge-width="200">
          <v-btn
            slot="activator"
            color="primary" text-color="white"
            class="ma-0 mr-2"
          >
            Join a party
          </v-btn>
          <v-card>
            <v-card-title>Immediately join a party with its ID.</v-card-title>
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
              >OK
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <v-menu v-if="spotifyAuthState" offset-y top :close-on-content-click="false" :nudge-width="200">
          <v-btn
            slot="activator"
            color="orange" text-color="white"
            class="ma-0 mr-2"
          >
            Create a party
          </v-btn>
        </v-menu>
        <v-btn
          v-else-if="!user && !event"
          slot="activator"
          color="green" text-color="white" @click="login"
          class="ma-0 mr-2"
        >
          <img src="@/assets/spotify-logo.svg" height="20"/> <span class="white-text">Sign in with Spotify</span>
        </v-btn>
        <v-btn v-if="user || spotifyAuthState" @click="signout">Sign Out</v-btn>
      </v-layout>
    </v-layout>
    <div v-if="playingTrack" id="music-meta" v-show="labelVisible">
      <img :src="playingTrack.album.images[0].url"/>
      <div>
        <h4 v-text="playingTrack.name"/>
        <p v-text="playingTrack.album.name"/>
        <p v-text="playingTrack.artists.map(a => a.name).join(', ')"/>
      </div>
    </div>
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
      labelVisible: false,
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
          if (this.user && doc.data().host === this.user.uid && this.spotifyAuthState) {
            // Is Host
            db.collection('events').doc(this.joinEvent).update({
              hostToken: this.spotifyAuthState.access_token
            })
          }
          auth.signInAnonymously().then(() => {
            this.$store.commit('changeEvent', this.joinEvent)
            this.updateProvider()
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
      this.labelVisible = true
      setTimeout(() => {
        this.labelVisible = false
      }, 3000)
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

<style scoped lang="styl">
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
  #music-meta {
    padding: 2rem;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    flex-direction: row;
    position: absolute;
    width: 24rem;
    height: 14rem;
    left: 5rem;
    bottom: 5rem;
    img {
      flex-shrink: 3;
      display: block;
      height: 10rem;
      width: 10rem;
    }
    div {
      margin-left: 1rem;
    }
  }
</style>
