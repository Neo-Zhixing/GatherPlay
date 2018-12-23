export default class SpotifyPullSynchronizer {
  /**
   * @param provider SpotifyProvider where the synchronizer fetch data from
   * @param pullingInterval integer representing the interval between pulls in ms
   */
  constructor (provider, pullingInterval=5000) {
    this.pullingInterval = pullingInterval
    this.provider = provider
  }
  delegate = null
  start () {
    this._puller = setInterval(this.pull.bind(this), this.pullingInterval)
    this.pull()
  }
  stop () {
    if (this._puller) clearInterval(this._puller)
  }
  async pull () {
    const playback = await this.provider.currentlyPlaying()
    const track = playback.item
    if (this.track && (this.track.id === track.id)) {
      // Still play the last one
      if (this.delegate) this.delegate.seek(playback.progress_ms, playback.is_playing)
      return
    }
    this.track = track
    if (this.delegate) this.delegate.load(track, playback.progress_ms, playback.is_playing)
  }
}
