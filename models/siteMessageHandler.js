const debug = require('debug')('millegrilles:vitrine:siteMessageHandler');
const {sauvegarderMapping, sauvegarderSite, sauvegarderCollectionFichiers, sauvegarderPage} = require('./filesystemDao')
const {extrairePostids, extraireCollectionsRecursif} = require('./siteModel')
const {chargerSites} = require('../models/siteDao')

var _mq,
    _noeudId,
    _socketIo

function init(mq, noeudId, socketIo) {
  _mq = mq
  _noeudId = noeudId
  _socketIo = socketIo
}

// Appele lors d'une reconnexion MQ
function on_connecter() {
  enregistrerChannel()
}

function enregistrerChannel() {
  _mq.routingKeyManager.addRoutingKeyCallback(
    function(routingKeys, message, opts) {majSite(routingKeys, message, opts)},
    ['evenement.Publication.confirmationMajSiteconfig'],
    {exchange: '1.public'}
  )

  _mq.routingKeyManager.addRoutingKeyCallback(
    function(routingKeys, message, opts) {majSection(routingKeys, message, opts)},
    [
      'evenement.Publication.confirmationMajPage',
      'evenement.Publication.confirmationMajCollectionFichiers',
    ],
    {exchange: '1.public'}
  )

  _mq.routingKeyManager.addResponseCorrelationId(
    'publication.section', (message, opts) => {publicationSection(message, opts)}
  )

}

async function majMapping(routingKeys, message, opts) {
  debug("MAJ mapping %O = %O", routingKeys, message)
}

async function majSite(routingKeys, message, opts) {
  debug("MAJ site %O = %O", routingKeys, message)
  await sauvegarderSite(message, _mq)

  // Emettre evenement socket.io de mise a jour de site
  const evenement = {
    site_id: message.site_id,
    estampille: message['en-tete'].estampille
  }

  debug("Emettre evenement sur socket.io/site majSiteConfig : %O", evenement)
  _socketIo.to('site').emit('majSiteconfig', evenement)
  _socketIo.to('site/data').emit('majSiteconfig', message)
}

async function majSection(routingKeys, message, opts) {
  debug("MAJ section routingKeys : %O", routingKeys)
  // const action = routingKeys.split('.').pop()
  //
  // let type_section;
  // switch(action) {
  //   case 'confirmationMajCollectionFichiers': type_section = 'collection_fichiers'; break
  //   case 'confirmationMajPage': type_section = 'page'; break
  //   default:
  // }

  const messageEnveloppe = {
    type_section: message.type_section,
    section_id: message.section_id,
    contenu: message,
  }

  await publicationSection(_mq, messageEnveloppe, opts)

  const evenement = {
    type_section: message.type_section,
    estampille: message['en-tete'].estampille,
  }
  const champs = ['section_id', 'uuid']
  champs.forEach(item=>{
    if(message[item]) evenement[item] = message[item]
  })

  debug("Emettre evenement sur socket.io/section majSection : %O", evenement)
  _socketIo.to('section').emit('majSection', evenement)
  _socketIo.to('section/data').emit('majSection', message)
}

// async function majPost(mq, routingKeys, message, opts) {
//   debug("MAJ post %O = %O", routingKeys, message)
//   await sauvegarderPosts(message, mq, {majSeulement: true})
//
//   // Emettre evenement pour les clients
//   await mq.routingKeyManager.socketio.emit('majPost', message)
//
// }

// async function majCollection(mq, routingKeys, message, opts) {
//   debug("MAJ collection %O = %O", routingKeys, message)
//   const params = {
//     _certificat: message._certificat,
//     liste_collections: [message]
//   }
//   await sauvegarderCollections(params, mq)
//
//   // Emettre evenement pour les clients
//   await mq.routingKeyManager.socketio.emit('majCollection', message)
//
// }

async function publicationSection(message, opts) {
  // Sauvegarder le fichier selon le type de section
  const typeSection = message['type_section']

  debug("Publication section %s id: %s\n%O", typeSection, message.section_id, message)

  switch(typeSection) {
    case 'collection_fichiers': await sauvegarderCollectionFichiers(message, _mq); break
    case 'page': await sauvegarderPage(message, _mq); break
    default:
  }
}

module.exports = {init, on_connecter, enregistrerChannel};
