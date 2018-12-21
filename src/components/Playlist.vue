<template>
  <v-container>
    <v-btn href="/" icon>
      <v-icon>arrow_back</v-icon>
    </v-btn>

    <v-card class="mt-5">
      <v-card-title class="headline font-weight-black white black--text ml-3 pt-5"
                    style="font-size: 40px !important; line-height: 1.05 !important;">
        {{event.toUpperCase()}} Playlist
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-subheader>Now playing</v-subheader>
          <v-list-tile v-if="playing">
            <v-list-tile-avatar tile>
              <img :src="playing.album.images.slice(-1)[0].url"/>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ playing.name }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ playing.album.name }} by {{ playing.artists.map(a=>a.name).join(', ')}}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn flat color="black" @click="skip">Skip</v-btn>
            </v-list-tile-action>
          </v-list-tile>
          <v-subheader>
            Upcoming
          </v-subheader>
          <template v-for="song in list">
            <v-list-tile :key="song.uri">
              <v-list-tile-avatar tile>
                <img :src="song.album.images.slice(-1)[0].url"/>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title v-text="song.name"/>
                <v-list-tile-sub-title>
                  <span v-text="song.artists.map(artist => artist.name).join(', ')"/>
                  <span> - </span>
                  <span v-text="song.album.name"/>
                </v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action v-if="song.proposer === user.uid">
                <v-btn @click="removeTrack(song)" icon>
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
            <v-divider :key="song.uri + ':divider'"/>
          </template>
        </v-list>
        <v-autocomplete
          prepend-icon="audiotrack"
          @input="addTrack"
          label="Track Name"
          hint="Click the icon to edit"
          :loading="trackSearch.loading"
          :items="trackSearch.items"
          item-text="name"
          :item-value="a => a"
          :search-input.sync="trackSearch.keyword"
          v-model="trackSearch.result"
          hide-no-data
          hide-details
          no-filter
        >
          <template
            slot="item"
            slot-scope="{ item, tile }"
          >
            <v-list-tile-avatar tile>
              <img :src="item.album.images.slice(-1)[0].url"/>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title v-text="item.name"/>
              <v-list-tile-sub-title>
                <span v-text="item.artists.map(artist => artist.name).join(', ')"/>
                <span> - </span>
                <span v-text="item.album.name"/>
              </v-list-tile-sub-title>
            </v-list-tile-content>
          </template>
        </v-autocomplete>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import firebase, { db } from '@/plugins/firebase'
import { mapState } from 'vuex'

export default {
  name: 'Playlist',
  props: ['event', 'list', 'playing'],
  data: () => ({
    trackSearch: {
      loading: false,
      items: [],
      keyword: null,
      result: null,
    },
  }),
  watch: {
    'trackSearch.keyword' (keyword) {
      !this.trackSearch.loading && keyword && keyword !== this.trackSearch.result && this.search(keyword)
    }
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
          return db.collection('events').doc(this.$route.params.event_id).update({
            playlist: firebase.firestore.FieldValue.arrayRemove(this.list[0]),
          })
        })
    },
    login () {
      this.$store.dispatch('spotify/login')
    },
    search (keyword) {
      this.trackSearch.loading = true
      this.$store.dispatch('spotify/request')
        .then(client => {
          return client.get('/search', {
            params: {
              q: keyword,
              type: 'track',
              limit: 5,
            }
          })
        })
        .then(response => {
          this.trackSearch.items = response.data.tracks.items
          this.trackSearch.loading = false
        }).catch(error => {
          this.trackSearch.loading = false
        })
    },
    addTrack () {
      this.trackSearch.result.proposer = this.user.uid
      db.collection('events').doc(this.event).update({
        playlist: firebase.firestore.FieldValue.arrayUnion(this.trackSearch.result)
      })
      this.trackSearch.result = null
    },
    removeTrack (track) {
      db.collection('events').doc(this.event).update({
        playlist: firebase.firestore.FieldValue.arrayRemove(track)
      })
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
  },
}
</script>

<style scoped>

</style>
