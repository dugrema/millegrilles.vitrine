const debug = require('debug')('millegrilles:vitrine:siteDao')
const {sauvegarderSites, sauvegarderPosts, sauvegarderCollections} = require('../models/filesystemDao')
const {extrairePostids, extraireCollectionsRecursif} = require('../models/siteModel')

async function chargerSites(amqpdao, noeudId) {
  const messageSites = await _chargerSites(amqpdao, noeudId)
  await sauvegarderSites(noeudId, messageSites, amqpdao)

  // Extraire post ids
  const postIdMap = {}
  var toutesCollections = false,
      collectionIds = {}
  messageSites.liste_sites.forEach(site=>{
    const postIds = extrairePostids(site)
    debug("Post ids du site %s : %O", site.site_id, postIds)
    postIds.forEach(postId=>postIdMap[postId]=true)  // Conserver postIds et faire dedupe

    if( ! toutesCollections ) {
      const collectionsInfo = extraireCollectionsRecursif(site)
      if(collectionsInfo.toutesCollections) {
        toutesCollections = true
      } else {
        debug("Collections du site %s : %O", site.site_id, collectionsInfo)
        collectionsInfo.collections.forEach(id=>{collectionIds[id]=true})  // Conserver Ids, dedupe
      }
    }
  })

  const messagePosts = await chargerPosts(amqpdao, Object.keys(postIdMap))
  debug("Posts recus : %O", messagePosts)
  await sauvegarderPosts(messagePosts, amqpdao)

  var messageCollections = null
  if(toutesCollections) {
    debug("Charger toutes les collections publiques")
    messageCollections = await chargerCollection(amqpdao)
  } else {
    collections = Object.keys(collectionIds)
    debug("Charger collections publiques : %O", collections)
    messageCollections = await chargerCollection(amqpdao, collections)
  }

  if(messageCollections) {
    await sauvegarderCollections(messageCollections, amqpdao)
  }

}

async function _chargerSites(amqpdao, noeudId) {
  debug("Charger sites pour noeud id: %s", noeudId)

  const domaineAction = 'Publication.sitesPourNoeud',
        requete = {noeud_id: noeudId}

  return await amqpdao.transmettreRequete(domaineAction, requete, {decoder: true})
}

async function chargerPosts(amqpdao, postIds) {
  debug("Charger post ids: %O", postIds)

  const domaineAction = 'Publication.posts',
        requete = {post_ids: postIds}

  return await amqpdao.transmettreRequete(domaineAction, requete, {decoder: true})
}

async function chargerCollection(amqpdao, collectionsIds) {
  debug("Charger collections ids : %O", collectionsIds)

  const domaineAction = 'GrosFichiers.detailCollectionsPubliques',
        requete = {}

  if(collectionsIds) {
    requete.collections = collectionsIds
  }

  return await amqpdao.transmettreRequete(domaineAction, requete, {decoder: true})
}

module.exports = {chargerSites, chargerPosts}
