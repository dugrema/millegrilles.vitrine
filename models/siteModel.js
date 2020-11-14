const debug = require('debug')('millegrilles:vitrine:siteModel')

function extrairePostids(site) {
  // Extrait la liste des post_id dans un site
  return _extrairePostidRecursif(site)
}

function extraireCollectionsRecursif(site) {
  // Extrait la liste des post_id dans un site
  try {
    const collections = _extraireCollectionsRecursif(site)
    return {collections}
  } catch(err) {
    if(err.toutesCollections) {
      return {toutesCollections: true}
    }
  }
}

function _extrairePostidRecursif(elem) {
  // debug("Element type : %s", typeof(elem))
  var postIds = []

  if( typeof(elem) === 'object' ) {
    for(let key in elem) {
      const value = elem[key]
      if(key === 'post_id') {
        postIds.push(value)
      } else if(typeof(value) === 'object') {
        const valeursRecursives = _extrairePostidRecursif(value)
        postIds = [...postIds, ...valeursRecursives]
      }
    }
  }

  return postIds
}

function _extraireCollectionsRecursif(elem) {
  // debug("Element type : %s", typeof(elem))
  var collections = []

  if( typeof(elem) === 'object' ) {
    for(let key in elem) {
      const value = elem[key]
      if(key === 'collections') {
        collections = [...collections, ...value]
      } else if(key === 'toutes_collections' && value === true) {
        throw new ErreurToutesCollections()
      } else if(typeof(value) === 'object') {
        const valeursRecursives = _extraireCollectionsRecursif(value)
        collections = [...collections, ...valeursRecursives]
      }
    }
  }

  return collections
}

class ErreurToutesCollections extends Error {
  toutesCollections = true
}

module.exports = {extrairePostids, extraireCollectionsRecursif}
