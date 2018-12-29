<template lang="pug">
  v-card(v-if="track")
    v-hover
      v-img(
        :aspect-ratio="1"
        :class="`elevation-${hover ? 12 : 2}`"
        slot-scope="{ hover }"
        :src="track.album.images[0].url"
      )
        div(class="playback-container" v-show="hover")
          v-btn(class="play-button" icon fab large color="primary" @click="toggle" v-if="playing")
            v-icon stop
          v-btn(class="play-button" icon fab large color="primary" @click="toggle" v-else)
            v-icon play_arrow
          v-btn(class="skip-button" color="secondary" @click="skip")
            span Skip
            v-icon skip_next
      // TODO: Lazyloading and srcset
    v-card-text(class="text-xs-center")
      h3(class="headline" v-text="track.name")
      h6(v-text="track.album.name")
      h6(v-text="track.artists.map(a=>a.name).join(', ')")
  div(v-else)
    p Nothing is playing
</template>

<script>
  export default {
    name: 'Playback',
    props: {
      track: Object,
      playing: Boolean,
    },
    methods: {
      skip() {
        this.$emit('skip')
      },
      toggle () {
        this.$emit('toggle')
        this.$emit(this.playing ? 'pause' : 'resume')
      },
    },
  }
</script>

<style scoped>
  .playback-container {
    height: 100%;
    width: 100%;
  }
  .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
  }
  .skip-button {
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translate(-50%, 0);
    margin: 0;
  }
</style>
