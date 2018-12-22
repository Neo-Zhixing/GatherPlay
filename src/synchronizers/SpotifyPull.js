import axios from 'axios'

export default class SpotifyPullSynchronizer {
  /**
   * @param provider SpotifyProvider where the synchronizer fetch data from
   * @param pullingInterval integer representing the interval between pulls in ms
   */
  constructor (provider, pullingInterval=5000) {
    this.pullingInterval = pullingInterval
    this.provider = provider
  }
  start () {
    this._puller = setInterval(this.pull.bind(this), this.pullingInterval)
    this.pull()
  }
  stop () {
    if (this._puller) clearInterval(this._puller)
  }
  async pull () {
    const track = await this.provider.currentlyPlaying()
    if (this.track && (this.track.id === track.id)) {
      // Still play the last one
      this.delegate.seek(playback.progress_ms)
      return
    }
    this.track = track
    this.delegate.load(track, playback.progress_ms)
  }
}
