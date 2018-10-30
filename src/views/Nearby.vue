<template lang="pug">
  googlemaps-map(
    :center="center"
    :zoom="15"
    style="height: 100%;"
    @idle="map => mapBounds = map.getBounds()"
  )
    googlemaps-user-position(@update:position="updateUserPosition")
</template>
<script>
import firebase, { db } from '@/plugins/firebase'
export default {
  name: 'Nearby',
  data () {
    return {
      center: { lat: 0, lng: 0 },
      mapBounds: null,
    }
  },
  methods: {
    updateUserPosition (event) {
      this.center.lat = event.lat
      this.center.lng = event.lng
    },
  },
  watch: {
    mapBounds (bounds) {
      const pointToGeoPoint = point => new firebase.firestore.GeoPoint(point.lat(), point.lng())
      db.collection('events')
        .where('location', '>', pointToGeoPoint(bounds.getNorthEast()))
        .where('location', '<', pointToGeoPoint(bounds.getSouthWest()))
        .get()
        .then(snapshot => {
          console.log(snapshot)
        })
      console.log(bounds)
    },
  },
}
</script>

<style scoped>

</style>
