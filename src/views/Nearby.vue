<template lang="pug">
  v-container(fill-height fluid).pa-0: v-layout
    v-flex(xs12 sm8): div(ref="map" style="height: 100%; z-index: 0;")
    v-flex(xs12 sm4): v-list
      v-list-tile(
        v-for="event in events"
        :key="event.id"
        @click="selectEvent(event)"
      )
        v-list-tile-content
          v-list-tile-title(v-text="event.name")
          v-list-tile-sub-title(v-html="event.description")
    v-dialog(v-model="eventDialog" max-width="600px"): v-card
      v-card-title(v-text="selectedEvent ? selectedEvent.name : ''")
      v-card-text(v-text="")
      v-card-actions
        v-btn(@click="eventDialog = false") Cancel
        v-btn(@click="join") Join
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
      selectedEvent: null,
      eventDialog: false,
    }
  },
  mounted () {
    this.map = new Map(this.$refs['map'])
    this.map.moveEnd = this.mapMoveEnd
    this.map.selectEvent = this.selectEvent
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
    },
    selectEvent (event) {
      this.selectedEvent = event
      this.eventDialog = true
    },
    join () {
      if (!this.selectedEvent) return
      this.$router.push({
        name: 'event',
        params: {
          event_id: this.selectedEvent.id,
        }
      })
    },
  },
}
</script>
