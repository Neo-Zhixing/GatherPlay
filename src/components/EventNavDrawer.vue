<template lang="pug">
  div
    v-divider
    v-list-tile(avatar)
      v-list-tile-avatar: v-icon local_play
      v-list-tile-content: v-list-tile-title Event
    v-list-tile(avatar)
      v-list-tile-avatar: v-icon queue_music
      v-list-tile-content: v-list-tile-title Playlist
    v-list-tile(avatar)
      v-list-tile-avatar: v-icon sync
      v-list-tile-content: v-list-tile-title Synced Visualization
    v-list-tile(avatar)
      v-list-tile-avatar: v-icon supervisor_account
      v-list-tile-content: v-list-tile-title Admin
</template>

<script>
export default {
  name: 'DrawerList',
}
</script>

<style scoped>

</style>
