// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { SectionMessagesSockets } = require('./MessageSockets');
const { maj_fichier_data, maj_collection } = require('./traitementFichiersData');
const { SectionAccueil, SectionBlogs, SectionSenseursPassifs } = require('./Sections');

// Constantes
const FICHE_PUBLIQUE = 'document.millegrilles_domaines_Annuaire.fiche.publique';
const DOCUMENT_VITRINE_FICHIERS = 'noeuds.source.millegrilles_domaines_Parametres.documents.vitrineFichiers';
const DOCUMENT_VITRINE_ALBUMS = 'noeuds.source.millegrilles_domaines_Parametres.documents.vitrineAlbums';
const CONFIGURATION_NOEUD_PUBLIC = 'noeuds.source.millegrilles_domaines_Parametres.documents.configuration.noeudPublic';
const PUBLICATION_DOCUMENT_FICHIERS = 'commande.WEB_URL.publierFichiers';
const PUBLICATION_DOCUMENT_ALBUMS = 'commande.WEB_URL.publierAlbums';
const PUBLICATION_COLLECTIONS = 'commande.WEB_URL.publierCollection';

// Vont etre rempli a l'initialisation avec WEB_URL
var COMMANDE_PUBLIER;

class WebSocketVitrineApp {

  constructor(server) {
    // this.sockets = {}; // Liste des sockets geres par l'application
    this.server = server;
    this.domaines = new GestionnaireDomaines();
  }

  initialiserDomaines(modeErreur) {
    this.domaines.initialiser(this.server, modeErreur);  // Lancer requete pour chargement initial
  }

  disconnectedHandler(socket) {
    // console.debug("Socket deconnecte " + socket.id);

    let socketResources = this.sockets[socket.id];
    if(socketResources) {
      socketResources.close();
    }

    delete this.sockets[socket.id];

    // console.debug("Nombre sockets ouverts: " + Object.keys(this.sockets).length);
  }

}

class GestionnaireDomaines {

  constructor() {
    this.domaines = {
      vitrineGlobal: new VitrineGlobal(),
      // senseursPassifs: new SenseursPassifsDomaine(),
      accueil: new SectionAccueil(),
      messages: new SectionMessagesSockets(),
      albums: new AlbumsSection(),
      fichiers: new FichiersSection(),
      blogs: new SectionBlogs(),
      senseurspassifs: new SectionSenseursPassifs(),
    }

    this.pathData = process.env.DATA_FOLDER;
    this.webUrl = process.env.WEB_URL;

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, modeErreur) {
    console.debug("Initialiser domaines, modeErreur:" + modeErreur);

    for(let domaine in this.domaines) {
      console.debug("Initialiser domaine " + domaine);
      this.domaines[domaine].initialiser(
        server, {pathData: this.pathData, webUrl: this.webUrl}, modeErreur
      );
    }
  }

}

class VitrineGlobal {

  constructor() {
    this.name = 'global';
    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;

    this.routingKeys = {};
    this.routingKeys[FICHE_PUBLIQUE] = true;
    this.routingKeys[CONFIGURATION_NOEUD_PUBLIC] = true;

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    this.pathData = opts.pathData;
    this.webUrl = opts.webUrl || process.env.WEB_URL;

    let webUrlFormatte = this.webUrl.replace(/\./g, '_');
    COMMANDE_PUBLIER = PUBLICATION_COLLECTIONS.replace('WEB_URL', webUrlFormatte);
    this.routingKeys[COMMANDE_PUBLIER] = true;

    // this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    this._enregistrerEvenements(server); // Enregistrer wss namespace
    if(!modeErreur) {
      this.requeteDocuments();
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn("VitrineGlobal: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  emit(cle, message) {
    // Recoit un message MQ
    // console.debug("Section VitrineGlobal Recu message " + message.routingKey);

    // Faire l'entretien du document local
    if(message.routingKey === FICHE_PUBLIQUE) {
      this.wssConnexion.emit('millegrille.configuration', message);
      maj_fichier_data(
        path.join(this.pathData, 'millegrille.json'),
        JSON.stringify(message.message)
      );
    } else if(message.routingKey === CONFIGURATION_NOEUD_PUBLIC) {
      // Verifier que le message est bien pour cette instance de Vitrine avec le WEB_URL
      if(message.message.web_url === this.web_url) {
        this.wssConnexion.emit('noeudPublic.configuration', message);
        maj_fichier_data(
          path.join(this.pathData, 'noeudPublic.json'),
          JSON.stringify(message.message)
        );
      }
    } else if(message.routingKey === COMMANDE_PUBLIER) {
      // console.debug("Recu collection")
      this.wssConnexion.emit('document.collection', message);
      maj_collection(
        path.join(this.pathData, 'collections'),
        message.message.uuid_source_figee,
        JSON.stringify(message.message)
      );
    } else if(message.routingKey === COMMANDE_PUBLIER_FICHIERS) {
      // console.debug("Recu maj fichiers")
      this.wssConnexion.emit('document.fichiers', message);
      maj_fichier_data(
        path.join(this.pathData, 'fichiers.json'),
        JSON.stringify(message.message)
      );
    }

  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    if(!this.timerChargement) {
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    }

    // Document milleGrille
    var routingRequeteMilleGrilleInitiale = 'requete.millegrilles.domaines.Annuaire.fichePublique';
    rabbitMQ.transmettreRequete(routingRequeteMilleGrilleInitiale, {})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse (fiche publique)
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats;
      // console.debug("Reponse millegrille.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'millegrille.json'),
        JSON.stringify(resultats)
      );

    })
    .catch(err=>{
      console.info("VitrineGlobal.requeteDocuments fichePublique: Erreur chargement, on va ressayer plus tard");
    })

    // Requete noeud public
    var routingRequeteNoeudInitiale = 'requete.millegrilles.domaines.Parametres.noeudPublic';
    rabbitMQ.transmettreRequete(routingRequeteNoeudInitiale, {web_url: this.web_url})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse (fiche publique)
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats[0];
      // console.debug("Reponse noeudPublic.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'noeudPublic.json'),
        JSON.stringify(resultats)
      );

    })
    .catch(err=>{
      console.info("VitrineGlobal.requeteDocuments noeudPublic: Erreur chargement, on va ressayer plus tard");
    })


  }


  rechargerDocuments() {
    console.info("VitrineGlobal.requeteDocuments noeudPublic: Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  _enregistrerEvenements(server) {
    let namespace = '/global';
    this.wssConnexion = server.of(namespace);
    // console.debug("Initialisation namespace " + namespace);
    this.wssConnexion.on('connection', socket=>{
      console.info('CONNECT_WSS ' + new Date() + ": Connexion sur " + namespace + ' a partir de ' + socket.handshake.address);
      socket.on('disconnect', ()=>{
        console.info('DISCONNECT_WSS ' + new Date() + ": Deconnexion de " + namespace + ' a partir de ' + socket.handshake.address);
      })
    })
  }

}

class FichiersSection {

  constructor() {
    this.name = 'fichiers';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;
    this.webUrl = null;
    this.commandePublier = null;

    this.routingKeys = {
      'noeuds.source.millegrilles_domaines_GrosFichiers.documentFichiers': true,
    };

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    // console.debug("init fichiers")
    // console.debug(opts);

    this.webUrl = opts.webUrl;

    let webUrlFormatte = this.webUrl.replace(/\./g, '_');
    this.commandePublier = PUBLICATION_DOCUMENT_FICHIERS.replace('WEB_URL', webUrlFormatte);
    this.routingKeys[this.commandePublier] = true;

    // this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    this.pathData = opts.pathData;
    this._enregistrerEvenements(server); // Enregistrer wss namespace

    if(!modeErreur) {
      this.requeteDocuments();
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn("Fichiers: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  emit(cle, message) {
    // Emet un message MQ
    // console.debug("Section Fichiers Recu message " + cle);

    // Faire l'entretien du document local
    if(message.routingKey === this.commandePublier) {
      this.wssConnexion.emit('contenu', message);
      maj_fichier_data(
        path.join(this.pathData, 'fichiers.json'),
        JSON.stringify(message.message)
      );
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    var routingRequeteInitiale = 'requete.millegrilles.domaines.GrosFichiers.vitrineFichiers';
    if(!this.timerChargement) {
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    }
    rabbitMQ.transmettreRequete(routingRequeteInitiale, {})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse (fiche publique)
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats;
      // console.debug("Reponse fichiers.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'fichiers.json'),
        JSON.stringify(resultats)
      );

      var collections = {};
      if(resultats.collections) {
        for(let uuid_collection_figee in resultats.collections) {
          collections[uuid_collection_figee] = true;
        }
      }

      return Object.keys(collections);
    })
    .then(collections=>{
      // console.debug("Charger fichiers: ")
      // console.debug(collections)

      var routingRequeteCollection = 'requete.millegrilles.domaines.GrosFichiers.collectionFigee';
      for(let idx in collections) {
        let uuid_collection = collections[idx];
        // Charger la plus recente version figee de la collection
        var requete = {uuid: uuid_collection};
        rabbitMQ.transmettreRequete(routingRequeteCollection, requete)
        .then(reponse=>{
          console.debug("Reponse fichier collection figee " + uuid_collection);
          let messageContent = reponse.content.toString('utf-8');
          let jsonMessage = JSON.parse(messageContent);
          // console.debug(jsonMessage.resultats);
          maj_collection(
            path.join(this.pathData, 'collections'),
            jsonMessage.resultats.uuid_source_figee,
            JSON.stringify(jsonMessage.resultats)
          );

        });
      }
    })
    .catch(err=>{
      console.info("FichiersSection.requetesDocuments: Erreur chargement, on va ressayer plus tard");
    })

  }

  rechargerDocuments() {
    console.info("FichiersSection.requetesDocuments: Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  _enregistrerEvenements(server) {
    let namespace = '/' + this.name;
    this.wssConnexion = server.of(namespace);
    console.debug("Initialisation namespace " + namespace);
    this.wssConnexion.on('connection', socket=>{
      console.info('CONNECT_WSS ' + new Date() + ": Connexion sur " + namespace + ' a partir de ' + socket.handshake.address);
      socket.on('disconnect', ()=>{
        console.info('DISCONNECT_WSS ' + new Date() + ": Deconnexion de " + namespace + ' a partir de ' + socket.handshake.address);
      })
    })
  }

}

class AlbumsSection {

  constructor() {
    this.name = 'albums';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;
    this.webUrl = null;
    this.commandePublierAlbums = null;

    this.routingKeys = {
      'noeuds.source.millegrilles_domaines_GrosFichiers.documentAlbums': true,
    };

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    // console.debug("init albums")
    // console.debug(opts);

    this.webUrl = opts.webUrl;

    let webUrlFormatte = this.webUrl.replace(/\./g, '_');
    this.commandePublierAlbums = PUBLICATION_DOCUMENT_ALBUMS.replace('WEB_URL', webUrlFormatte);
    this.routingKeys[this.commandePublierAlbums] = true;

    // this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    this.pathData = opts.pathData;
    this._enregistrerEvenements(server); // Enregistrer wss namespace

    if(!modeErreur) {
      this.requeteDocuments();
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn("Albums: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  emit(cle, message) {
    // Emet un message MQ
    // console.debug("Section Albums Recu message " + cle);

    // Faire l'entretien du document local
    if(message.routingKey === this.commandePublierAlbums) {
      this.wssConnexion.emit('contenu', message);
      maj_fichier_data(
        path.join(this.pathData, 'albums.json'),
        JSON.stringify(message.message)
      );
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    var routingRequeteInitiale = 'requete.millegrilles.domaines.GrosFichiers.vitrineAlbums';
    if(!this.timerChargement) {
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    }
    rabbitMQ.transmettreRequete(routingRequeteInitiale, {})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse (fiche publique)
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats;
      // console.debug("Reponse albums.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'albums.json'),
        JSON.stringify(resultats)
      );

      var collections = {};
      if(resultats.collections) {
        for(let uuid_collection_figee in resultats.collections) {
          collections[uuid_collection_figee] = true;
        }
      }

      return Object.keys(collections);
    })
    .then(collections=>{
      // console.debug("Charger albums: ")
      // console.debug(collections)

      var routingRequeteCollection = 'requete.millegrilles.domaines.GrosFichiers.collectionFigee';
      for(let idx in collections) {
        let uuid_collection = collections[idx];
        // Charger la plus recente version figee de la collection
        var requete = {uuid: uuid_collection};
        rabbitMQ.transmettreRequete(routingRequeteCollection, requete)
        .then(reponse=>{
          // console.debug("Reponse fichier collection figee " + uuid_collection);
          let messageContent = reponse.content.toString('utf-8');
          let jsonMessage = JSON.parse(messageContent);
          // console.debug(jsonMessage.resultats);
          maj_collection(
            path.join(this.pathData, 'collections'),
            jsonMessage.resultats.uuid_source_figee,
            JSON.stringify(jsonMessage.resultats)
          );

        });
      }
    })
    .catch(err=>{
      console.info("AlbumsSection.requetesDocuments: Erreur chargement, on va ressayer plus tard");
    })

  }

  rechargerDocuments() {
    console.info("AlbumsSection.requetesDocuments: Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  _enregistrerEvenements(server) {
    let namespace = '/' + this.name;
    this.wssConnexion = server.of(namespace);
    // console.debug("Initialisation namespace " + namespace);
    this.wssConnexion.on('connection', socket=>{
      console.debug('CONNECT_WSS ' + new Date() + ": Connexion sur " + namespace + ' a partir de ' + socket.handshake.address);
      socket.on('disconnect', ()=>{
        console.debug('DISCONNECT_WSS ' + new Date() + ": Deconnexion de " + namespace + ' a partir de ' + socket.handshake.address);
      })
    })
  }

}

module.exports = {WebSocketVitrineApp}
