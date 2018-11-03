import Leaflet from 'leaflet'


const LocalStorageKeyPrefix = 'gatherplay_map_last_'
const LocalStorageKey = Object.freeze({
  lng: LocalStorageKeyPrefix + 'lng',
  lat: LocalStorageKeyPrefix + 'lat',
})

function MaterialIcon (name) {
  return Leaflet.divIcon({
    className: 'v-icon material-icons theme--light',
    html: name
  })
}
const MyLocationIcon = MaterialIcon('my_location')
const MarkerIcon = MaterialIcon('location_on')
Leaflet.Marker.prototype.options.icon = MarkerIcon

export default class LeafletMap {
  constructor (element) {
    this.eventMarkers = new Map()
    const lat = localStorage.getItem(LocalStorageKey.lat) || 0
    const lng = localStorage.getItem(LocalStorageKey.lng) || 0
    const zoom = 14
    const map = Leaflet.map(element, {
      center: [lat, lng],
      zoom: zoom,
    })
    this.map = map
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a', 'b', 'c'],
    }).addTo(map)
    map.locate({ setView: true, maxZoom: zoom })
      .on('locationfound', event => this.onLocationFound(event))

    map.on('movestart', event => this.moveStart ? this.moveStart(event) : null)
      .on('moveend', event => this.moveEnd ? this.moveEnd(event) : null)
  }
  getBounds () {
    const bounds = this.map.getBounds()
    return {
      ne: bounds.getNorthEast(),
      sw: bounds.getSouthWest(),
    }
  }
  addMarkers (events) {
    const markersInRange = new Set()
    events.forEach(event => {
      markersInRange.add(event.id)
      if (this.eventMarkers.has(event.id)) {
        return
      }
      this.eventMarkers.set(event.id, event)
      const marker = Leaflet.marker({ lat: event.location.latitude, lng: event.location.longitude })
      marker.bindTooltip(event.name)
      marker.on('click', () => this.selectEvent ? this.selectEvent(event) : null)
      marker.addTo(this.map)
    })
    // TODO: Remove Extra Markers
  }
  onLocationFound (event) {
    Leaflet.marker(event.latlng, { icon: MyLocationIcon }).addTo(this.map)
    localStorage.setItem(LocalStorageKey.lat, event.latlng.lat)
    localStorage.setItem(LocalStorageKey.lng, event.latlng.lng)
    if (this.locationFound) this.locationFound(event.latlng)
  }
}
