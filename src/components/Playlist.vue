<template lang="pug">
  v-list
    template(v-for="song in list")
      v-list-tile(:key="song.uri")
        v-list-tile-avatar(tile)
          img(:src="song.album.images.slice(-1)[0].url")
        v-list-tile-content
          v-list-tile-title(v-text="song.name")
          v-list-tile-sub-title
            span(v-text="song.artists.map(artist => artist.name).join(', ')")
            span -
            span(v-text="song.album.name")
        v-list-tile-action(v-if="song.proposer === user.uid")
          v-btn(@click="removeTrack(song)" icon)
            v-icon delete
      v-divider(:key="song.uri + ':divider'")
</template>

<script>
export default {
  name: 'Playlist',
  props: {
    list: Array,
    playing: Object,
  },
  methods: {
    removeTrack (track) {
      this.$emit('remove', track)
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
