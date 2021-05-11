// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:vitrine:appSocketIo');

const routingKeysPublic = [
  'appSocketio.nodejs',  // Juste pour trouver facilement sur exchange - debug
]

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPublics: [
      {eventName: 'challenge', callback: (params, cb) => {challenge(socket, params, cb)}},
      {eventName: 'ecouterMaj', callback: _ => {ecouterMaj(socket)}},
    ]
  }

  debug("appSocketIo.configurationEvenements complete")

  return configurationEvenements
}

// async function getDocumentsParUuid(socket, params, cb) {
//   const dao = socket.grosFichiersDao
//   try {
//     const uuidsDocuments = params.uuids_documents
//     debug("Demande documents pas uuid : %O", )
//     const documents = await dao.getDocumentsParUuid(uuidsDocuments)
//     cb(documents)
//   } catch(err) {
//     debug("Erreur getDocumentsParUuid\n%O", err)
//     cb({err: 'Erreur: ' + err})
//   }
// }

async function challenge(socket, params, cb) {
  // Repondre avec un message signe
  const reponse = {
    reponse: params.challenge,
    message: 'Trust no one'
  }
  const reponseSignee = await socket.amqpdao.pki.formatterMessage(reponse, 'challenge', {ajouterCertificat: true})
  console.debug("Reponse signee : %O", reponseSignee)
  cb(reponseSignee)
}

async function ecouterMaj(socket) {
  debug("Ajout evenements maj pour socket")
  socket.join('site')
  socket.join('section')
}

module.exports = {
  configurerEvenements
}
