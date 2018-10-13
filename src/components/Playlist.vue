<template>
  <v-card>
    <v-card-title class="headline font-weight-regular blue-grey white--text">
      Playlist
    </v-card-title>
    <v-card-text>
      <v-list>
        <v-subheader>
          Upcoming
        </v-subheader>
        <template v-for="song in list">
          <v-list-tile :key="song.uri">
            <v-list-tile-content>
              <v-list-tile-title v-text="song.name"/>
              <v-list-tile-sub-title v-text="song.artists.map(artist => artist.name).join(', ')"/>
            </v-list-tile-content>
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
      </v-autocomplete>
    </v-card-text>
    <v-btn @click="login">login</v-btn>
  </v-card>
</template>

<script>
import firebase, { db } from '@/plugins/firebase'
export default {
  name: 'Playlist',
  props: {
    event: String,
    list: Array,
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
      const client = this.$store.getters['spotify/client']
      client.get('/search', {
        params: {
          q: keyword,
          type: 'track',
          limit: 5,
        }
      }).then(response => {
        this.trackSearch.items = response.data.tracks.items
        this.trackSearch.loading = false
      })
    },
    addTrack () {
      db.collection('events').doc(this.event).update({
        playlist: firebase.firestore.FieldValue.arrayUnion(this.trackSearch.result)
      })
      this.trackSearch.result = null
    }
  }
}
</script>

<style scoped>

</style>
