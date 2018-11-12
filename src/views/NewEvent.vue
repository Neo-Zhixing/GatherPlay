<template lang="pug">
  v-card
    v-stepper(v-model="step" non-linear vertical)
      v-stepper-step(
        :complete="step > 1"
        editable
        step="1"
        :rules="[() => formValid]"
      )
        span Basics
      v-stepper-content(:step="1"): v-form(v-model="formValid"): v-layout(wrap)
        v-flex(xs12 sm6): v-text-field(
          label="ID"
          :rules="rules"
          v-model="eventID"
          :hint="eventLink"
          :error-messages="idTaken ? ['This ID was already taken!'] : []"
          @input="idTaken = false"
          required
        )
        v-flex(xs12 sm6): v-text-field(
          label="Name"
          v-model="form.name"
          hint="The Human Readable Name"
        )
        v-textarea(
          label="Description"
          v-model="form.description"
        )
      v-stepper-step(:complete="step > 2" editable :step="2")
        span Authentication
        small Who can join the event
      v-stepper-content(:step="2")
        v-select(
          :items="authOptions"
          v-model="form.authentication"
        )
        v-text-field(
          v-show="form.authentication === 1"
          label="Password"
          v-model="form.password"
        )
        v-checkbox(
          v-show="form.authentication !== 3"
          label="Needs Approval"
          v-model="form.approval_needed"
        )
        p(v-text="hint").caption
      v-stepper-step(:complete="step > 3" editable :step="3")
        span Location
        small Help your guests find the event
      v-stepper-content(:step="3")
        v-switch(label="Enable" v-model="form.enable_location").ml-3
        v-switch(label="Use my Realtime Location" v-show="form.enable_location" v-model="form.realtime_location").ml-3
        l-map(
          v-if="shouldDisplayMap"
          ref="map"
          @click="mapClicked"
          style="height: 15rem; z-index:0;")
          l-tile-layer(
            :name="tileProvider.name"
            :url="tileProvider.url"
            :attribution="tileProvider.attribution"
            layer-type="base")
          l-marker(
            v-if="form.location"
            draggable
            :lat-lng.sync="form.location"
            :icon="markerIcon")
    v-card-actions
      v-spacer
      v-btn(@click="createEvent" :disabled="!formValid" :loading="loading") Create
      v-btn(@click="$emit('cancel')") Cancel
</template>

<script>
import { mapState, mapActions } from 'vuex'
import firebase, { db } from '@/plugins/firebase'
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet'
import { tileProvider, MyLocationIcon } from '../plugins/map'
const authOptions = [
  { text: 'Open', value: 0, des: 'Anyone can join the event' },
  { text: 'Password', value: 1, des: 'Only guests with password could join the event' },
  { text: 'Invitation', value: 2, des: 'Only guests refereed by old members could join the event' },
  { text: 'Closed', value: 3, des: 'Only you can add new members into the event' },
]
export default {
  name: 'newevent',
  components: {
    LMap, LTileLayer, LMarker,
  },
  data () {
    return {
      step: 1,
      authOptions: authOptions,
      formValid: false,
      idTaken: false,
      eventID: '',
      loading: false,
      form: {
        authentication: 0,
        name: '',
        password: null,
        approval_needed: false,
        location: null,
        enable_location: true,
        realtime_location: false,
        description: '',
      }
    }
  },
  mounted () {
    window.navigator.geolocation.getCurrentPosition(event => {
      const coords = {
        lat: event.coords.latitude,
        lng: event.coords.longitude,
      }
      this.form.location = coords
      console.log(this.$refs['map'])
      //this.$refs['map'].setZoom(13)
    })
  },
  methods: {
    ...mapActions({
      login: 'spotify/login'
    }),
    createEvent () {
      if (!this.user || this.user.isAnonymous) {
        console.error("Unauthenticated user attempted creating new event", this.user)
        return
      }
      this.loading = true
      const docRef = db.collection('events').doc(this.eventID)
      docRef.get()
        .then(doc => {
          if (doc.exists) {
            this.idTaken = true
            this.step = 1
            return
          }
          const form = Object.assign({}, this.form)
          if (form.password === '') form.password = null
          form.location = form.enable_location && !form.realtime_location
            ? new firebase.firestore.GeoPoint(form.location.lat, form.location.lng) : null
          form.owner = this.user.uid
          return docRef.set(form)
            .then(() => {
              this.$emit('created', this.eventID)
            })
        }).then(() => {
          this.loading = false
        }).catch(error => {
          this.loading = false
        })
    },
    mapClicked (location) {
      console.log(location)
      this.form.location.lat = location.latlng.lat
      this.form.location.lng = location.latlng.lng
    },
  },
  computed: {
    ...mapState({
      spotifyLoggedIn: state => state.spotify.authenticated,
      user: state => state.user,
    }),
    hint () {
      return this.authOptions[this.form.authentication].des +
        (!this.form.approval_needed || this.form.authentication === 3 ? '.' : ' with your approval.')
    },
    eventLink () {
      return process.env.VUE_APP_HOST + '/e/' + this.eventID
    },
    rules () {
      return [
        v => !this.idTaken || 'The event ID was already taken',
        v => !!v || 'Event Name is required',
        v => (v && v.length > 3) || 'Event Name must be greater than 3 characters',
        v => (v && v.length <= 20) || 'Event Name must be less than 20 characters',
        v => (v && !/[^\w-]/.test(v)) || 'Event Name could only contains of letters, numbers and - ',
      ]
    },
    shouldDisplayMap () {
      return this.form.enable_location && !this.form.realtime_location
    },
    tileProvider: () => tileProvider,
    markerIcon: () => MyLocationIcon,
  },
}
</script>
