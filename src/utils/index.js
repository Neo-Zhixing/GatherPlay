export function encodeURL (data) {
  return Object.keys(data).map(
    key => [key, data[key]].map(encodeURIComponent).join('=')
  ).join('&')
}
