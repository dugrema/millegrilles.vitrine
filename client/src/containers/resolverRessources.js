import axios from 'axios'

var _cdns = ''

export function init(cdns) {
  _cdns = cdns
}

export function resolveUrl(url) {
  return axios({method: 'get', url, timeout: 10000})
}
