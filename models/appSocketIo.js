// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:vitrine:appSocketIo');

const routingKeysPublic = [
  'appSocketio.nodejs',  // Juste pour trouver facilement sur exchange - debug
]

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'vitrine/', callback: (params, cb) => {getDocumentsParUuid(socket, params, cb)}},
    ],
    listenersProteges: [
    ]
  }

  return configurationEvenements
}

async function getDocumentsParUuid(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const uuidsDocuments = params.uuids_documents
    debug("Demande documents pas uuid : %O", )
    const documents = await dao.getDocumentsParUuid(uuidsDocuments)
    cb(documents)
  } catch(err) {
    debug("Erreur getDocumentsParUuid\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

module.exports = {
  configurationEvenements
}
