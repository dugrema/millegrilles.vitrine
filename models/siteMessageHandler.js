const {sauvegarderSites, sauvegarderPosts, sauvegarderCollections} = require('./filesystemDao')

class SiteMessageHandler {

  constructor(mq, noeudId) {
    this.mq = mq
    this.noeudId = noeudId
    this.routingKeys = null
  }

  // Appele lors d'une reconnexion MQ
  on_connecter() {
    this.enregistrerChannel()
  }

  enregistrerChannel() {
    this.routingKeys = [
      'evenement.Publication.confirmationMajSite',
      'evenement.Publication.confirmationMajPost',
    ]

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

  }

}

function majSite(mq, routingKeys, message, noeudId, opts) {
  console.debug("MAJ site %O = %O", routingKeys, message)
  const params = {
    noeud_id: noeudId,
    liste_sites: [message],
    _certificat: message._certificat,
  }
  // La signature du message a deja ete validee - sauvegarder la maj
  sauvegarderSites(noeudId, params, mq)
}

function majPost(mq, routingKeys, message, opts) {
  console.debug("MAJ post %O = %O", routingKeys, message)
  sauvegarderPosts(message, mq)
}

module.exports = {SiteMessageHandler};
