<template>
  <v-menu>
    <v-btn slot="activator" color="blue" large dark icon>
      <v-icon large dark>account_circle</v-icon>
    </v-btn>
    <v-list>
      <v-list-tile
        v-for="(item, i) in items"
        :key="i"
        @click="signOut"
      >
        <v-list-tile-title>{{ item.title }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: 'ProfileButton',
  data: () => ({
    items: [
      { title: 'Sign Out' }
    ]
  }),
  methods: {
    signOut: function () {
      // placeholder
      console.log('Signed out')
    }
  }
}
</script>

<style scoped>

</style>
