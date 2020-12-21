const debug = require('debug')('millegrilles:vitrine:siteMessageHandler');
const {sauvegarderSites, sauvegarderPosts, sauvegarderCollections} = require('./filesystemDao')
const {extrairePostids, extraireCollectionsRecursif} = require('./siteModel')
const {chargerSites} = require('../models/siteDao')

class SiteMessageHandler {

  constructor(mq, noeudId) {
    this.mq = mq
    this.noeudId = noeudId
  }

  // Appele lors d'une reconnexion MQ
  on_connecter() {
    this.enregistrerChannel()
  }

  enregistrerChannel() {
    const mq = this.mq,
          noeudId = this.noeudId

    this.mq.routingKeyManager.addRoutingKeyCallback(
      function(routingKeys, message, opts) {majSite(mq, routingKeys, message, noeudId, opts)},
      ['evenement.Publication.confirmationMajSite']
    )

    this.mq.routingKeyManager.addRoutingKeyCallback(
      function(routingKeys, message, opts) {majPost(mq, routingKeys, message, opts)},
      ['evenement.Publication.confirmationMajPost']
    )

    this.mq.routingKeyManager.addRoutingKeyCallback(
      function(routingKeys, message, opts) {majCollection(mq, routingKeys, message, opts)},
      ['evenements.GrosFichiers.confirmationMajCollectionPublique']
    )

  }

}

async function majSite(mq, routingKeys, message, noeudId, opts) {
  debug("MAJ site %O = %O", routingKeys, message)

  if(message.noeuds_urls[noeudId]) {
    const params = {
      noeud_id: noeudId,
      liste_sites: [message],
      _certificat: message._certificat,
    }
    // La signature du message a deja ete validee - sauvegarder la maj
    await sauvegarderSites(noeudId, params, mq)

    // Importer tous les posts, collections du site
    // Raccourci - On recharge le noeud au complet
    await chargerSites(mq, noeudId)

    // Emettre evenement pour les clients
    await mq.routingKeyManager.socketio.emit('majSite', message)

  } else {
    debug("Site recu sur exchange public, ne correspond pas au noeudId %s : %O", noeudId, message.noeuds_urls)
  }
}

async function majPost(mq, routingKeys, message, opts) {
  debug("MAJ post %O = %O", routingKeys, message)
  await sauvegarderPosts(message, mq, {majSeulement: true})

  // Emettre evenement pour les clients
  await mq.routingKeyManager.socketio.emit('majPost', message)

}

async function majCollection(mq, routingKeys, message, opts) {
  debug("MAJ collection %O = %O", routingKeys, message)
  const params = {
    _certificat: message._certificat,
    liste_collections: [message]
  }
  await sauvegarderCollections(params, mq)

  // Emettre evenement pour les clients
  await mq.routingKeyManager.socketio.emit('majCollection', message)

}

module.exports = {SiteMessageHandler};
