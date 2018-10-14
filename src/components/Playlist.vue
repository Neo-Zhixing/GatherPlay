<template>
  <v-card>
    <v-card-title class="headline font-weight-regular blue-grey white--text">
      Playlist
    </v-card-title>
    <v-card-text>
      <v-list>
        <v-subheader>Currently playing:</v-subheader>
        <v-list-tile v-if="playing">
          <h3>{{ playing.name }}</h3>
        </v-list-tile>
        <v-subheader>
          Upcoming
        </v-subheader>
        <template v-for="song in list">
          <v-list-tile :key="song.uri">
            <v-list-tile-content>
              <v-list-tile-title v-text="song.name"/>
              <v-list-tile-sub-title>
                <span v-text="song.artists.map(artist => artist.name).join(', ')"/>
                <span> - </span>
                <span v-text="song.album.name"/>
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action v-if="song.proposer === user.uid">
              <v-btn @click="removeTrack(song)" icon><v-icon>delete</v-icon></v-btn>
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
      >
        <template
          slot="item"
          slot-scope="{ item, tile }"
        >
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
    <v-btn @click="login">login</v-btn>
  </v-card>
</template>

<script>
import firebase, { db } from '@/plugins/firebase'
import { mapState } from 'vuex'
export default {
  name: 'Playlist',
  props: {
    event: String,
    list: Array,
    playing: Object,
  },
  data () {
    return {
      trackSearch: {
        loading: false,
        items: [],
        keyword: null,
        result: null,
      },
    }
  },
  watch: {
    'trackSearch.keyword' (keyword) {
      !this.trackSearch.loading && keyword && keyword !== this.trackSearch.result && this.search(keyword)
    }
  },
  methods: {
    login () {
      this.$store.dispatch('spotify/login')
    },
    search (keyword) {
      this.trackSearch.loading = true
      this.$store.getters['spotify/client']
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
