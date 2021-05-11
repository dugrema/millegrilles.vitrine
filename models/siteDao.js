const debug = require('debug')('millegrilles:vitrine:siteDao')
const {sauvegarderMapping, sauvegarderPosts, sauvegarderCollections} = require('../models/filesystemDao')
const {extrairePostids, extraireCollectionsRecursif} = require('../models/siteModel')

async function chargerMapping(amqpdao, noeudId) {
  const domaineAction = 'Publication.configurationSitesNoeud',
        requete = {noeud_id: noeudId}

  const messageSites = await amqpdao.transmettreRequete(domaineAction, requete, {decoder: true})

  // const messageSites = await _chargerSites(amqpdao, noeudId)
  debug("siteDao.chargerSites message configuration : %O", messageSites)
  await sauvegarderMapping(noeudId, messageSites, amqpdao)
}

async function chargerSections(amqpdao, noeudId) {
  debug("Demander chargement des sections")
  const domaineAction = 'Publication.pousserSections',
        commande = {noeud_id: noeudId}

  // Transmettre commande (note: payload va etre mis directement sur la Q)
  const confirmation = await amqpdao.transmettreCommande(domaineAction, commande, {decoder: true})
  debug("Confirmation pousser sections : %O", confirmation)
}

module.exports = {chargerMapping, chargerSections}
