// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { SectionMessagesSockets } = require('./MessageSockets');
const { maj_fichier_data, maj_collection } = require('./traitementFichiersData');

// Constantes
const FICHE_PUBLIQUE = 'document.millegrilles_domaines_Annuaire.fiche.publique';
const CONFIGURATION_NOEUD_PUBLIC = 'noeuds.source.millegrilles_domaines_Parametres.documents.configuration.noeudPublic';
const DOCUMENT_VITRINE_FICHIERS = 'noeuds.source.millegrilles_domaines_Parametres.documents.vitrineFichiers';
const DOCUMENT_VITRINE_ALBUMS = 'noeuds.source.millegrilles_domaines_Parametres.documents.vitrineAlbums';
const PUBLICATION_COLLECTIONS = 'commande.WEB_URL.publierCollection';
var COMMANDE_PUBLIER;  // Va etre rempli a l'initialisation

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

    console.debug("Nombre sockets ouverts: " + Object.keys(this.sockets).length);
  }

}

class GestionnaireDomaines {

  constructor() {
    this.domaines = {
      vitrineGlobal: new VitrineGlobal(),
      senseursPassifs: new SenseursPassifsDomaine(),
      accueil: new AccueilSection(),
      messages: new SectionMessagesSockets(),
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
        server, {pathData: this.pathData, webUrl: this.web_url}, modeErreur
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
    console.debug("Section VitrineGlobal Recu message " + message.routingKey);

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
      console.debug("Recu collection")
      maj_collection(
        path.join(this.pathData, 'collections'),
        message.message.uuid_source_figee,
        JSON.stringify(message.message)
      );
    } else if(message.routingKey === DOCUMENT_VITRINE_FICHIERS) {
      console.debug("Recu maj fichiers")
      maj_fichier_data(
        path.join(this.pathData, 'fichiers.json'),
        JSON.stringify(message.message)
      );
    } else if(message.routingKey === DOCUMENT_VITRINE_ALBUMS) {
      console.debug("Recu maj albums")
      maj_fichier_data(
        path.join(this.pathData, 'albums.json'),
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
      console.debug("Reponse millegrille.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'millegrille.json'),
        JSON.stringify(resultats)
      );

    })
    .catch(err=>{
      console.info("Erreur chargement, on va ressayer plus tard");
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
      console.debug("Reponse noeudPublic.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'noeudPublic.json'),
        JSON.stringify(resultats)
      );

    })
    .catch(err=>{
      console.info("Erreur chargement, on va ressayer plus tard");
    })

    // Requete documents sections
    var routingRequeteGrosFichiers = 'requete.millegrilles.domaines.GrosFichiers.fichiersVitrine';
    rabbitMQ.transmettreRequete(routingRequeteGrosFichiers, {})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse (fiche publique)
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats[0];
      // console.debug("Reponse GrosFichiers sauvegarde sous " + this.pathData);

      // console.debug("JSON Message");
      // console.debug(jsonMessage);
      // console.debug("Resultats");
      // console.debug(jsonMessage.resultats);

      const collections = {};
      for(let idx in jsonMessage.resultats) {
        let documentFichier = jsonMessage.resultats[idx];

        let mgLibelle = documentFichier['_mg-libelle'];
        var nomFichier = null;
        if(mgLibelle === 'vitrine.fichiers') {
          nomFichier = 'fichiers.json';
        } else if(mgLibelle === 'vitrine.albums') {
          nomFichier = 'albums.json';
        }

        console.debug("Sauvergarde fichier " + nomFichier + " pour " + mgLibelle);
        if(nomFichier) {
          maj_fichier_data(
            path.join(this.pathData, nomFichier),
            JSON.stringify(documentFichier)
          );
        }

        if(documentFichier.collections) {
          for(let uuid_collection_figee in documentFichier.collections) {
            collections[uuid_collection_figee] = true;
          }
        }

      }

      // Retourner la liste de collections a charger
      return Object.keys(collections);

    })
    .then(collections => {
      var routingRequeteCollection = 'requete.millegrilles.domaines.GrosFichiers.collectionFigee';
      for(let idx in collections) {
        let uuid_collection = collections[idx];
        // Charger la plus recente version figee de la collection
        var requete = {uuid: uuid_collection};
        rabbitMQ.transmettreRequete(routingRequeteCollection, requete)
        .then(reponse=>{
          console.debug("Reponse fichier collection figee");
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
      console.info("Erreur chargement, on va ressayer plus tard");
    })
  }


  rechargerDocuments() {
    console.info("Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  _enregistrerEvenements(server) {
    let namespace = '/global';
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

class AccueilSection {

  constructor() {
    this.name = 'accueil';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;

    this.routingKeys = {
      // 'document.millegrilles_domaines_Annuaire.fiche.publique': true,
    };

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    // this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    this.pathData = opts.pathData;
    this._enregistrerEvenements(server); // Enregistrer wss namespace
    if(!modeErreur) {
      this.requeteDocuments();
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn("SenseursPassifs: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  emit(cle, message) {
    // Emet un message MQ
    console.debug("Section AccueilSection Recu message " + cle);
    this.wssConnexion.emit(cle, message);

    // Faire l'entretien du document local
    if(message.routingKey === FICHE_PUBLIQUE) {
      maj_fichier_data(
        path.join(this.pathData, 'millegrille.json'),
        JSON.stringify(message.message)
      );
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    // var routingRequeteInitiale = 'requete.millegrilles.domaines.Annuaire.fichePublique';
    // if(!this.timerChargement) {
    //   this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    // }
    // rabbitMQ.transmettreRequete(routingRequeteInitiale, {})
    // .then(reponse=>{
    //   if(this.timerChargement) {
    //     clearTimeout(this.timerChargement);
    //     this.timerChargement = null;
    //   }
    //
    //   // Extraire l'element resultats de la reponse (fiche publique)
    //   let messageContent = reponse.content.toString('utf-8');
    //   let jsonMessage = JSON.parse(messageContent);
    //   const resultats = jsonMessage.resultats;
    //   console.debug("Reponse millegrille.json, sauvegarde sous " + this.pathData);
    //
    //   maj_fichier_data(
    //     path.join(this.pathData, 'millegrille.json'),
    //     JSON.stringify(resultats)
    //   );
    //
    // })
    // .catch(err=>{
    //   console.info("Erreur chargement, on va ressayer plus tard");
    // })
  }

  rechargerDocuments() {
    console.info("Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  _enregistrerEvenements(server) {
    let namespace = '/accueil';
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

class SenseursPassifsDomaine {
  // Structure pour les senseurs passifs (copie du domaine, public)

  constructor() {
    this.name = 'senseursPassifs';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;

    this.senseurs = {};
    this.noeuds = {};

    this.routingKeys = {
      'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel': true,
      'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel': true,
    };

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    if(!modeErreur) {
      this.requeteDocuments();
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn("SenseursPassifs: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    var routingRequeteSenseursPassifs = 'requete.millegrilles.domaines.SenseursPassifs';
    var requetesSenseursPassifs = {
      'requetes': [
        {
          'filtre': {
            '_mg-libelle': 'noeud.individuel',
            // 'securite': '1.public',
          }
        },
        {
          'filtre': {
            '_mg-libelle': 'senseur.individuel',
            // 'securite': '1.public',
          }
        },
       ]};

    if(!this.timerChargement) {
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    }
    rabbitMQ.transmettreRequete(routingRequeteSenseursPassifs, requetesSenseursPassifs)
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      this._chargementInitial(reponse);
      if(this.wssConnexion) {
        this.wssConnexion.emit('documents', this._serialiser());
      }
    })
    .catch(err=>{
      console.info("Erreur chargement, on va ressayer plus tard");
    })
  }

  rechargerDocuments() {
    console.info("Tentative de rechargement des documents");
    if(this.timerChargement) {
      clearTimeout(this.timerChargement);
      this.timerChargement = null;
    }
    this.requeteDocuments();
  }

  emit(cle, message) {
    // Emet un message MQ
    this.wssConnexion.emit(cle, message);

    // Faire l'entretien du document local
    if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel') {
      let senseur = message.message;
      this._maj_senseur(senseur);
    } else if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel') {
      let noeud = message.message;
      this._maj_noeud(noeud);
    }
  }

  _serialiser() {
    return {noeuds: this.noeuds, senseurs: this.senseurs};
  }

  _enregistrerEvenements(server) {
    let namespace = '/senseursPassifs';
    this.wssConnexion = server.of(namespace);
    console.debug("Initialisation namespace " + namespace);
    this.wssConnexion.on('connection', socket=>{
      console.info('CONNECT_WSS ' + new Date() + ": Connexion sur " + namespace + ' a partir de ' + socket.handshake.address);
      socket.on('disconnect', ()=>{
        console.info('DISCONNECT_WSS ' + new Date() + ": Deconnexion de " + namespace + ' a partir de ' + socket.handshake.address);
      })
      socket.emit('documents', this._serialiser());
    })
  }

  _chargementInitial(reponse) {
    console.debug("Reponse requete initiale");
    let messageContent = reponse.content.toString('utf-8');
    let json_message = JSON.parse(messageContent);
    // console.debug(json_message);

    // Reset le contenu en memoire
    this.noeuds = {};
    this.senseurs = {};

    let requeteNoeuds = json_message.resultats[0];
    let requeteSenseurs = json_message.resultats[1];

    for(let idx in requeteNoeuds) {
      let noeud = requeteNoeuds[idx];
      this._maj_noeud(noeud);
      // console.debug(noeud);
    }

    for(let idx in requeteSenseurs) {
      let senseur = requeteSenseurs[idx];
      this._maj_senseur(senseur);
      // console.debug(senseur);
    }

  }

  _maj_noeud(noeud) {
    this.noeuds[noeud.noeud] = noeud;
  }

  _maj_senseur(senseur) {
    this.senseurs[senseur.senseur + '@' + senseur.noeud] = senseur;
  }

  _recevoirMessageMQ(message) {
    console.debug("Message MQ SenseursPassifs");
    console.debug(message.content.toString('utf-8'));
  }

}

module.exports = {WebSocketVitrineApp}
