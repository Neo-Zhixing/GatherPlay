const loadSpotifyPlayerJS = new Promise((resolve, reject) => {
  const script = document.createElement('script')
  script.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js')
  document.head.appendChild(script)
  window.onSpotifyWebPlaybackSDKReady = resolve
})

export default class SpotifyWebPlayer {
  delegate = null
  track = null
  deviceID = null
  constructor (provider) {
    this.provider = provider
  }
  start () {
    const provider = this.provider
    const keyStore = provider.accessKey
    const apiEndpoint = provider.apiEndpoint
    return loadSpotifyPlayerJS
      .then(() => {
        const player = new Spotify.Player({
          name: 'Gather Play',
          getOAuthToken: async callback => {
            let accessKey = keyStore.get()
            if (!accessKey) accessKey = await apiEndpoint.get('/spotify/auth/refresh')
              .then(response => {
                keyStore.set(response.data.access_token, response.data.expires_in)
                return response.data.access_token
              })
            callback(accessKey)
          }
        })
        this.player = player

        // Error handling
        if (this.onerror) {
          [
            'initialization_error',
            'authentication_error',
            'account_error',
            'playback_error',
          ].forEach(errorType => {
            player.addListener(errorType, ({ message }) => this.onerror(errorType, message))
          })
        }

        // Playback status updates
        player.addListener('player_state_changed', (state) => {
          console.log('player state changed')
          this.update(state)
        })

        // Ready
        player.addListener('ready', ({ device_id }) => {
          this.deviceID = device_id
          if (this.onready) this.onready(true, device_id)
          console.log('Ready with Device ID', device_id)
          this.pull()
        })

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
          this.deviceID = device_id
          if (this.onready) this.onready(false, device_id)
          console.log('Device ID has gone offline', device_id)
          this.pull()
        })

        // Connect to the player!
        return player.connect()
          .then(success => {
            if (!success) {
              return new Promise.reject('error connecting to player')
            }
          })
      })
  }

  pull () {
    if (!this.player) {
      return
    }
    this.player.getCurrentState().then(this.update.bind(this))
  }

  update (state) {
    console.log('update state', state)
    if (this.delegate && this.delegate.update)
      this.delegate.update(state)
    if (!state || (state.paused && state.position === 0)) {
      // Nothing is playing
        if (this.delegate && this.delegate.load)
          this.delegate.load(null) // Last time it was playing; load nothing
      this.track = null
      return
    }
    const track = state.track_window.current_track
    if (this.track && (this.track.id === track.id)) {
      // Still play the last one
      if (this.delegate && this.delegate.seek)
        this.delegate.seek(state.position, !state.paused)
      return
    }
    this.track = track
    if (this.delegate && this.delegate.load)
      this.delegate.load(track, state.position, !state.paused)
  }
}
