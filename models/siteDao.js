const debug = require('debug')('millegrilles:vitrine:siteDao')

async function chargerSites(amqpdao, noeudId) {
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

module.exports = {chargerSites, chargerPosts}
