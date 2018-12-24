<template lang="pug">
  v-autocomplete(
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
  )
    template(
      slot="item"
      slot-scope="{ item, tile }"
    )
      v-list-tile-avatar(tile)
        img(:src="item.album.images.slice(-1)[0].url")
      v-list-tile-content
        v-list-tile-title(v-text="item.name")
        v-list-tile-sub-title
          span(v-text="item.artists.map(artist => artist.name).join(', ')")
          span -
          span(v-text="item.album.name")
</template>

<script>
export default {
  name: 'music-input',
  data: () => ({
    trackSearch: {
      loading: false,
      items: [],
      keyword: null,
      result: null,
    },
  }),
  methods: {
    addTrack () {
      this.$emit('add', this.trackSearch.result)
      this.trackSearch.result = null
    },
    search (keyword) {
      this.trackSearch.loading = true
      const provider = this.$store.getters['spotify/provider']
      provider.client.get('/search', {
        params: {
          q: keyword,
          type: 'track',
          limit: 5,
        }
      })
        .then(response => {
          this.trackSearch.items = response.data.tracks.items
          this.trackSearch.loading = false
        }).catch(error => {
        this.trackSearch.loading = false
      })
    },
  },
  watch: {
    'trackSearch.keyword' (keyword) {
      !this.trackSearch.loading && keyword && keyword !== this.trackSearch.result && this.search(keyword)
    }
  },
}
</script>

<style scoped>

</style>
