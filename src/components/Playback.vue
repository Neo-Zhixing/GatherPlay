<template lang="pug">
  v-card
    v-img(:src="playing.album.images[0].url") // TODO: Lazyloading and srcset
    v-card-text(class="text-xs-center")
      h3(class="headline" v-text="playing.name")
      h6(v-text="playing.album.name")
      h6(v-text="playing.artists.map(a=>a.name).join(', ')")
</template>

<script>
  export default {
    name: 'Playback',
    props: {
      playing: Object,
    },
    methods: {
      skip() {
        this.$emit('skip')
      }
    },
    watch: {
      playing () {

      }
    }
  }
</script>

<style scoped>

</style>
