// WebSocket api pour l'application React Vitrine
const debug = require('debug')('millegrilles:vitrine:reactwss')
const os = require('os')
const fs = require('fs')
const path = require('path')

const { VitrineGlobal, SectionAccueil, SectionBlogs, SectionAnnonces } = require('./sectionsconfig')

// const { maj_fichier_data, maj_collection } = require('../util/traitementFichiersData')
// const { VitrineGlobal, SectionAccueil, SectionBlogs, SectionSenseursPassifs } = require('./Sections')

// Constantes
// const DOCUMENT_VITRINE_FICHIERS = 'evenement.Parametres.document.vitrineFichiers'
// const DOCUMENT_VITRINE_ALBUMS = 'evenement.Parametres.document.vitrineAlbums'
// const PUBLICATION_DOCUMENT_FICHIERS = 'commande.vitrine.publierFichiers'
// const PUBLICATION_DOCUMENT_ALBUMS = 'commande.vitrine.publierAlbums'
// const PUBLICATION_COLLECTIONS = 'commande.vitrine.publierCollection'

class WebSocketVitrineApp {

  constructor(server, amqpdao, nodeId, modeErreur) {
    this.server = server
    this.amqpdao = amqpdao
    this.nodeId = nodeId
    this.modeErreur = modeErreur || false

    this.domaines = null

    // Ecouter evenements de deconnexion
    server.on('connection', this.connectionHandler)
    server.on('disconnect', this.disconnectedHandler)
  }

  initialiserDomaines(opts) {
    this.domaines = new GestionnaireDomaines(opts)
    this.domaines.initialiser(this.server, this.amqpdao, this.nodeId, this.modeErreur)
  }

  connectionHandler(socket) {
    console.info('%s Socket.IO connection : %s',  new Date(), socket.handshake.address);
  }

  disconnectedHandler(socket) {
    console.info('%s Socket.IO disconnect : %s',  new Date(), socket.handshake.address);
  }

}

class GestionnaireDomaines {

  constructor(opts) {
    this.opts = opts || {}
    this.domaines = {
      vitrineGlobal: new VitrineGlobal(),
      accueil: new SectionAccueil(),
      blogs: new SectionBlogs(),
      annonces: new SectionAnnonces(),
      // albums: new AlbumsSection(),
      // fichiers: new FichiersSection(),
      // senseurspassifs: new SectionSenseursPassifs(),
    }

    this.pathData = this.opts.pathData || process.env.DATA_FOLDER || '/tmp/vitrine';
    this.webUrl = process.env.WEB_URL;

    // this.initialiser = this.initialiser.bind(this);
  }

  async initialiser(server, amqpdao, nodeId, modeErreur) {
    console.info("Initialiser domaines, modeErreur:" + modeErreur);

    // Sur connexion, juste emettre message login true
    server.on('connection', socket => {
      socket.emit('pret', {'login': true})

      socket.on('section.join', message => {
        const section = message.section
        debug("Socket %s join section %s", socket.id, section)
        socket.join(section)
      })

      socket.on('section.leave', message => {
        const section = message.section
        debug("Socket %s leave section %s", socket.id, section)
        socket.leave(section)
      })

    })

    for(let domaine in this.domaines) {
      console.info("Initialiser domaine " + domaine);
      const instDomaine = this.domaines[domaine]
      await instDomaine.initialiser(
        server, amqpdao, nodeId,
        {pathData: this.pathData, webUrl: this.webUrl, modeErreur}
      );
    }
  }

}

// class FichiersSection {
//
//   constructor() {
//     this.name = 'fichiers';
//
//     this.wssConnexion = null;
//
//     this.dateChargement = null;
//     this.timerChargement = null;
//     this.pathData = null;
//     this.webUrl = null;
//     this.commandePublier = null;
//
//     this.routingKeys = {
//       'noeuds.source.millegrilles_domaines_GrosFichiers.documentFichiers': true,
//     };
//
//     this.initialiser = this.initialiser.bind(this);
//   }
//
//   initialiser(server, opts, modeErreur) {
//     // console.debug("init fichiers")
//     // console.debug(opts);
//
//     this.webUrl = opts.webUrl;
//
//     let webUrlFormatte = this.webUrl.replace(/\./g, '_');
//     this.commandePublier = PUBLICATION_DOCUMENT_FICHIERS.replace('WEB_URL', webUrlFormatte);
//     this.routingKeys[this.commandePublier] = true;
//
//     // this._enregistrerEvenements(server);
//     rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
//     this.pathData = opts.pathData;
//     this._enregistrerEvenements(server); // Enregistrer wss namespace
//
//     if(!modeErreur) {
//       this.requeteDocuments();
//     } else {
//       // On va attendre avant de charger les documents. Le system est probablement
//       // en initialisation/reboot.
//       console.warn("Fichiers: Attente avant du chargement des documents (60s)");
//       this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
//     }
//   }
//
//   emit(cle, message) {
//     // Emet un message MQ
//     // console.debug("Section Fichiers Recu message " + cle);
//
//     // Faire l'entretien du document local
//     if(message.routingKey === this.commandePublier) {
//       this.wssConnexion.emit('contenu', message);
//       maj_fichier_data(
//         path.join(this.pathData, 'fichiers.json'),
//         JSON.stringify(message.message)
//       );
//     }
//   }
//
//   requeteDocuments() {
//     // Effectuer les requetes et conserver localement les resultats
//     var routingRequeteInitiale = 'requete.millegrilles.domaines.GrosFichiers.vitrineFichiers';
//     if(!this.timerChargement) {
//       this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
//     }
//     rabbitMQ.transmettreRequete(routingRequeteInitiale, {})
//     .then(reponse=>{
//       if(this.timerChargement) {
//         clearTimeout(this.timerChargement);
//         this.timerChargement = null;
//       }
//
//       // Extraire l'element resultats de la reponse (fiche publique)
//       let messageContent = reponse.content.toString('utf-8');
//       let jsonMessage = JSON.parse(messageContent);
//       const resultats = jsonMessage.resultats;
//       // console.debug("Reponse fichiers.json, sauvegarde sous " + this.pathData);
//
//       maj_fichier_data(
//         path.join(this.pathData, 'fichiers.json'),
//         JSON.stringify(resultats)
//       );
//
//       var collections = {};
//       if(resultats.collections) {
//         for(let uuid_collection_figee in resultats.collections) {
//           collections[uuid_collection_figee] = true;
//         }
//       }
//
//       return Object.keys(collections);
//     })
//     .then(collections=>{
//       // console.debug("Charger fichiers: ")
//       // console.debug(collections)
//
//       var routingRequeteCollection = 'requete.millegrilles.domaines.GrosFichiers.collectionFigee';
//       for(let idx in collections) {
//         let uuid_collection = collections[idx];
//         // Charger la plus recente version figee de la collection
//         var requete = {uuid: uuid_collection};
//         rabbitMQ.transmettreRequete(routingRequeteCollection, requete)
//         .then(reponse=>{
//           // console.debug("Reponse fichier collection figee " + uuid_collection);
//           let messageContent = reponse.content.toString('utf-8');
//           let jsonMessage = JSON.parse(messageContent);
//           // console.debug(jsonMessage.resultats);
//           maj_collection(
//             path.join(this.pathData, 'collections'),
//             jsonMessage.resultats.uuid_source_figee,
//             JSON.stringify(jsonMessage.resultats)
//           );
//
//         });
//       }
//     })
//     .catch(err=>{
//       console.info("FichiersSection.requetesDocuments: Erreur chargement, on va ressayer plus tard");
//     })
//
//   }
//
//   rechargerDocuments() {
//     console.info("FichiersSection.requetesDocuments: Tentative de rechargement des documents");
//     if(this.timerChargement) {
//       clearTimeout(this.timerChargement);
//       this.timerChargement = null;
//     }
//     this.requeteDocuments();
//   }
//
//   _enregistrerEvenements(server) {
//     let namespace = '/' + this.name;
//     this.wssConnexion = server.of(namespace);
//     console.info("Initialisation namespace " + namespace);
//     this.wssConnexion.on('connection', socket=>{
//       console.info('CONNECT_WSS ' + new Date() + ": Connexion sur " + namespace + ' a partir de ' + socket.handshake.address);
//       socket.on('disconnect', ()=>{
//         console.info('DISCONNECT_WSS ' + new Date() + ": Deconnexion de " + namespace + ' a partir de ' + socket.handshake.address);
//       })
//     })
//   }
//
// }
//
// class AlbumsSection {
//
//   constructor() {
//     this.name = 'albums';
//
//     this.wssConnexion = null;
//
//     this.dateChargement = null;
//     this.timerChargement = null;
//     this.pathData = null;
//     this.webUrl = null;
//     this.commandePublierAlbums = null;
//
//     this.routingKeys = {
//       'noeuds.source.millegrilles_domaines_GrosFichiers.documentAlbums': true,
//     };
//
//     this.initialiser = this.initialiser.bind(this);
//   }
//
//   initialiser(server, opts, modeErreur) {
//     // console.debug("init albums")
//     // console.debug(opts);
//
//     this.webUrl = opts.webUrl;
//
//     let webUrlFormatte = this.webUrl.replace(/\./g, '_');
//     this.commandePublierAlbums = PUBLICATION_DOCUMENT_ALBUMS.replace('WEB_URL', webUrlFormatte);
//     this.routingKeys[this.commandePublierAlbums] = true;
//
//     // this._enregistrerEvenements(server);
//     rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
//     this.pathData = opts.pathData;
//     this._enregistrerEvenements(server); // Enregistrer wss namespace
//
//     if(!modeErreur) {
//       this.requeteDocuments();
//     } else {
//       // On va attendre avant de charger les documents. Le system est probablement
//       // en initialisation/reboot.
//       console.warn("Albums: Attente avant du chargement des documents (60s)");
//       this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
//     }
//   }
//
//   emit(cle, message) {
//     // Emet un message MQ
//     // console.debug("Section Albums Recu message " + cle);
//
//     // Faire l'entretien du document local
//     if(message.routingKey === this.commandePublierAlbums) {
//       this.wssConnexion.emit('contenu', message);
//       maj_fichier_data(
//         path.join(this.pathData, 'albums.json'),
//         JSON.stringify(message.message)
//       );
//     }
//   }
//
//   requeteDocuments() {
//     // Effectuer les requetes et conserver localement les resultats
//     var routingRequeteInitiale = 'requete.millegrilles.domaines.GrosFichiers.vitrineAlbums';
//     if(!this.timerChargement) {
//       this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
//     }
//     rabbitMQ.transmettreRequete(routingRequeteInitiale, {})
//     .then(reponse=>{
//       if(this.timerChargement) {
//         clearTimeout(this.timerChargement);
//         this.timerChargement = null;
//       }
//
//       // Extraire l'element resultats de la reponse (fiche publique)
//       let messageContent = reponse.content.toString('utf-8');
//       let jsonMessage = JSON.parse(messageContent);
//       const resultats = jsonMessage.resultats;
//       // console.debug("Reponse albums.json, sauvegarde sous " + this.pathData);
//
//       maj_fichier_data(
//         path.join(this.pathData, 'albums.json'),
//         JSON.stringify(resultats)
//       );
//
//       var collections = {};
//       if(resultats.collections) {
//         for(let uuid_collection_figee in resultats.collections) {
//           collections[uuid_collection_figee] = true;
//         }
//       }
//
//       return Object.keys(collections);
//     })
//     .then(collections=>{
//       // console.debug("Charger albums: ")
//       // console.debug(collections)
//
//       var routingRequeteCollection = 'requete.millegrilles.domaines.GrosFichiers.collectionFigee';
//       for(let idx in collections) {
//         let uuid_collection = collections[idx];
//         // Charger la plus recente version figee de la collection
//         var requete = {uuid: uuid_collection};
//         rabbitMQ.transmettreRequete(routingRequeteCollection, requete)
//         .then(reponse=>{
//           // console.debug("Reponse fichier collection figee " + uuid_collection);
//           let messageContent = reponse.content.toString('utf-8');
//           let jsonMessage = JSON.parse(messageContent);
//           // console.debug(jsonMessage.resultats);
//           maj_collection(
//             path.join(this.pathData, 'collections'),
//             jsonMessage.resultats.uuid_source_figee,
//             JSON.stringify(jsonMessage.resultats)
//           );
//
//         });
//       }
//     })
//     .catch(err=>{
//       console.info("AlbumsSection.requetesDocuments: Erreur chargement, on va ressayer plus tard");
//     })
//
//   }


module.exports = {WebSocketVitrineApp}
