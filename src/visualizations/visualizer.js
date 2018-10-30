import SpotifyConnect from './spotify-connect'

class Visualizer extends SpotifyConnect {
  constructor () {
    super()

    this.active = false
    this.initialized = false
    this.loadingNext = false
    this.events = {
      beforeInit: () => {},
      afterInit: () => {},
      beforeStart: () => {},
      afterStart: () => {},
      beforeStop: () => {},
      afterStop: () => {}
    }

    this.onTrackComplete = () => {
      this.loadingNext = true
      this.stopVisualizer()
    }
  }

  startVisualizer (hideToast) {
    if (!hideToast) {
      // ...
    }

    if (this.initialized === false) {
      this.events.beforeInit.call()
      this.initialized = true
      this.events.afterInit.call()
    }

    this.setIntervalHooks()
    this.events.beforeStart.call()
    this.events.afterStart.call()
    this.initializeHooks()
    this.active = true
  }

  stopVisualizer () {
    this.events.beforeStop.bind(this).call()
    this.removeHooks()
    this.updateTrackProgress(0, true)
    this.active = false
    this.events.afterStop.bind(this).call()
  }

  processResponse (response) {
    this.updateTrackProgress()

    const songsInSync = true
    const syncError = 1501
    // const syncError = 0

    const getData = (noToast) => {
      const timestamp = window.performance.now()
      this.currentlyPlaying = response
      Promise.all([
        this.getTrackFeatures(),
        this.getTrackAnalysis()
      ]).then((responses) => {
        console.log(responses[0])
        this.loadingNext = false
        this.stopVisualizer()
        this.trackFeatures = responses[0]
        this.trackAnalysis = responses[1]
        this.updateTrackProgress((response.delay) + (window.performance.now() - timestamp))
        this.startVisualizer(noToast)
        this.pingSpotify()
      })
    }

    response.is_playing = true // FORCE

    if (this.active && response.is_playing && songsInSync && syncError > 1500) {
      return getData(true)
    }

    if (typeof response !== 'object' || !response.is_playing) {
      if (!this.loadingNext) {
      }

      if (this.active) {
        this.stopVisualizer()
      }

      return this.pingSpotify()
    }

    if (!this.active) {
      if (songsInSync && this.loadingNext) {
        return this.pingSpotify()
      }

      return getData()
    } else {
      if (songsInSync) {
        return this.pingSpotify()
      }

      getData()
    }
  }

  pingSpotify (skipDelay) {
    setTimeout(() => {
      this.getCurrentlyPlaying()
        .then((response) => this.processResponse(response))
        .catch((err) => this.processResponse(err))
    }, skipDelay ? 0 : 1000)
  }
}

export default Visualizer
