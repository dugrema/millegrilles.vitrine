import axios from 'axios'

var _cdns = ''

export function init(cdns) {
  _cdns = cdns
  console.debug("CDNs initialises, commencer a verifier les sources : %O", cdns)
}

export async function resolveUrl(url) {
  const reponse = await axios({method: 'get', url, timeout: 15000})
  return {status: reponse.status, data: reponse.data}
}
