<template>
  <v-container>
    <v-layout align-center justify-center column>
      <v-spacer></v-spacer>
      <v-flex>
        <h1 class="display-4 font-weight-black">404</h1>
      </v-flex>
      <v-flex>
        <h1 class="font-italic">
          This page does not exist :'(
        </h1>
      </v-flex>
      <v-flex>
        <v-btn @click="bringMeBack">
          bring me back
        </v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: 'PageNotFound',
  methods: {
    bringMeBack () {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>

</style>
