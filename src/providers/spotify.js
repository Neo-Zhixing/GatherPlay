import axios from 'axios'

import ColorThief from 'color-thief'
const colorThief = new ColorThief()

export default class SpotifyProvider {
  constructor (cacheStore, apiEndpoint) {
    this.accessKey = cacheStore
    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
      headers: {},
    })
    this.client.interceptors.request.use(async config => {
      // TODO: resolve when request failed at this stage, the caller does not get an error.
      // Instead they get a response with no data. (resposne.data = null)
      let accessKey = this.accessKey.get()
      if (!accessKey) accessKey = await apiEndpoint.get('/spotify/auth/refresh')
        .catch(error => {
          // TODO: change status code to 404
          // retry with client credential
          if (error.response && error.response.status === 401 && config.fallbackClientCredential) {
            return apiEndpoint.get('/spotify/auth/client-credential')
          }
          else return Promise.reject(error)
        })
        .then(response => {
          this.accessKey.set(response.data.access_token, response.data.expires_in)
          return response.data.access_token
        })
      config.headers['Authorization'] = 'Bearer ' + accessKey
      return config
    })
    this.client.interceptors.response.use(
      response => response,
      error => {
        // TODO: If the request was ever rejected for outdated codes, automatically refresh the token or prompt login.
        return error
      }
    )
  }

  login () {
    const newWindow = window.open(
      process.env.VUE_APP_API_ENDPOINT + '/spotify/auth/login',
      'spotify-login',
      'height=500,width=700'
    )
    if (window.focus) newWindow.focus()
    return new Promise((resolve, reject) => {
      const spotifyLoginCallback = (event) => {
        if (event.origin !== process.env.VUE_APP_API_ENDPOINT) {
          return
        }
        window.removeEventListener('message', spotifyLoginCallback, false)
        this.accessKey.set(event.data.spotify.access_token, event.data.spotify.expires_in)
        resolve(event.data)
      }
      window.addEventListener('message', spotifyLoginCallback, false)
    })
  }
  logout () {
    this.accessKey.flush()
  }
  get loggedIn () {
    return !!this.accessKey.get()
  }

  /**
   * @return {Track}
   */
  async currentlyPlaying () {
    // TODO test when nothing's playing, the server could return 204
    const response = await this.client.get('me/player/currently-playing')
    const playback = response.data
    if (!playback.is_playing) {
      return null
    }
    return playback.item
  }

  /**
   * Obtain the lyrics for a track.
   * Search for the song on imjad.cn, and pick the first song for its lyrics.
   *
   * @param {Track} track
   * @returns {Promise<string>} lyrics in lrc format
   */
  async getLyrics (track) {
    let response = await axios.get(`https://api.imjad.cn/cloudmusic/?type=search&search_type=1&s=${
      track.name +
      ' ' +
      track.artists
        .map(a => a.name).join(' ')
    }`)
    if (!response.data.result.songs) return null
    const id = response.data.result.songs[0].id
    response = await axios.get(`https://api.imjad.cn/cloudmusic/?type=lyric&id=${id}`)
    return response && response.data && response.data.lrc && response.data.lrc.lyric
  }

  /**
   * Obtain the analysis for a track
   *
   * @param {Track} track
   * @returns {Promise<TrackAnalysis>}
   */
  getAnalysis (track) {
    return this.client.get(`/audio-analysis/${track.id}`)
      .then(response => response.data)
  }

  /**
   * Obtain the palette for a track
   *
   * @param {Track} track
   * @returns {Array<Color>>}
   */
  getPalette (track) {
    return colorThief.getColorFromUrl(track.album.images[0].url, 3, 5)
      .then(palette => {
        console.log(palette)
        return palette
      })
  }
}
