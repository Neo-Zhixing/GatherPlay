<template lang="pug">
  v-card
    v-tabs(centered v-model="form.authentication")
      v-tab(v-for="(item, index) in authOptions" :key="index")
        span(v-text="item.title")
        v-icon(v-text="item.icon")
    v-card-title(primary-title): h3.headline.mb-0 Create a New Event
    v-card-text: v-form(v-model="formValid")
      v-layout(wrap)
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
      p(v-text="hint").caption.mb-0.mt-3
    v-card-actions
      v-spacer
      v-btn(flat @click="createEvent" :disabled="!formValid" :loading="loading") Create
      v-btn(flat @click="$emit('cancel')") Cancel
</template>

<script>
import { mapState, mapActions } from 'vuex'
import config from '@/../config.json'
import { db } from '@/plugins/firebase'
const authOptions = [
  { title: 'Open', icon: 'lock_open', des: 'Anyone can join the event' },
  { title: 'Password', icon: 'account_box', des: 'Only guests with password could join the event' },
  { title: 'Invitation', icon: 'link', des: 'Only guests refereed by old members could join the event' },
  { title: 'Closed', icon: 'lock', des: 'Only you can add new members into the event' },
]
export default {
  name: 'newevent',
  data () {
    return {
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
      }
    }
  },
  methods: {
    ...mapActions({
      login: 'spotify/login'
    }),
    createEvent () {
      this.loading = true
      const docRef = db.collection('events').doc(this.eventID)
      if (this.form.password === '') {
        this.form.password = null
      }
      docRef.get()
        .then(doc => {
          if (doc.exists) {
            this.idTaken = true
            return
          }
          return docRef.set(this.form)
            .then(() => {
              this.$emit('created', this.eventID)
            })
        }).then(() => {
          this.loading = false
        }).catch(error => {
          this.loading = false
        })
    },
  },
  computed: {
    ...mapState({
      spotifyLoggedIn: state => state.spotify.authenticated
    }),
    hint () {
      return this.authOptions[this.form.authentication].des +
        (!this.form.approval_needed || this.form.authentication === 3 ? '.' : ' with your approval.')
    },
    eventLink () {
      return config.host + '/e/' + this.eventID
    },
    rules () {
      return [
        v => !this.idTaken || 'The event ID was already taken',
        v => !!v || 'Event Name is required',
        v => (v && v.length > 3) || 'Event Name must be greater than 3 characters',
        v => (v && v.length <= 20) || 'Event Name must be less than 20 characters',
        v => (v && !/[^\w-]/.test(v)) || 'Event Name could only contains of letters, numbers and - ',
      ]
    }
  }
}
</script>
