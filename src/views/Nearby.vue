<template lang="pug">
  v-container(fill-height fluid).pa-0: v-layout
    v-flex(xs12 sm8 ref="map")
    v-flex(xs12 sm4): v-list
      v-list-tile(v-for="event in events" :key="event.id")
        v-list-tile-content
          v-list-tile-title(v-text="event.name")
          v-list-tile-sub-title(v-html="event.description")
</template>
<script>
import firebase, { db } from '@/plugins/firebase'
import Map from '@/plugins/map'

const pointToGeoPoint = point => new firebase.firestore.GeoPoint(point.lat, point.lng)

export default {
  name: 'Nearby',
  data () {
    return {
      events: [],
    }
  },
  mounted () {
    this.map = new Map(this.$refs['map'])
    this.map.moveEnd = this.mapMoveEnd
  },
  methods: {
    mapMoveEnd () {
      const bounds = this.map.getBounds()
      db.collection('events')
        .where('location', '<', pointToGeoPoint(bounds.ne))
        .where('location', '>', pointToGeoPoint(bounds.sw))
        .get()
        .then(snapshot => {
          this.events = snapshot.docs.map(event => {
            const data = event.data()
            data.id = event.id
            return data
          })
          this.map.addMarkers(this.events)
        })
    }
  },
}
</script>
