// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');

class WebSocketVitrineApp {

  constructor(server) {
    // this.sockets = {}; // Liste des sockets geres par l'application
    this.server = server;
    this.domaines = new GestionnaireDomaines();
  }

  initialiserDomaines() {
    this.domaines.initialiser(this.server);  // Lancer requete pour chargement initial
  }

  // getDocumentsDomaine(domaine) {
  //   return this.domaines.getDocumentsDomaine(domaine);
  // }
  //
  // addSocket(socket) {
  //   // Ajoute un socket d'une nouvelle connexion
  //   // console.debug("Nouveau socket!");
  //   if(!socket.disconnected) {
  //     let socketResources = new WebSocketResources(socket, this.etatDocumentsDomaines);
  //
  //     // S'assure que le socket n'a pas ete deconnecte avant d'ajouter
  //     // l'evenement de gestion du disconnect
  //     socket.on('disconnect', ()=>{
  //       this.disconnectedHandler(socket);
  //     });
  //     this.sockets[socket.id] = socketResources;
  //     console.debug("Connexion socket " + socket.id);
  //   }
  //
  // }

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
      senseursPassifs: new SenseursPassifsDomaine(),
    }

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server) {
    console.debug("Initialiser domaines");

    for(let domaine in this.domaines) {
      console.debug("Initialiser domaine " + domaine);
      this.domaines[domaine].initialiser(server);
    }
  }

}

class SenseursPassifsDomaine {
  // Structure pour les senseurs passifs (copie du domaine, public)

  constructor() {
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

  initialiser(server) {
    this._enregistrerEvenements(server);
    rabbitMQ.routingKeyManager.addRoutingKeyForNamespace(this, Object.keys(this.routingKeys));
    this.requeteDocuments();
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

    rabbitMQ.transmettreRequete(routingRequeteSenseursPassifs, requetesSenseursPassifs)
    .then(reponse=>{
      this._chargementInitial(reponse);
      if(this.wssConnexion) {
        this.wssConnexion.emit('documents', this._serialiser());
      }
    })
    .catch(err=>{
      console.info("Erreur chargement, on va ressayer plus tard");
      if(!this.timerChargement) {
        setTimeout(()=>{this.rechargerDocuments()}, 15000);  // Ressayer dans 15 secondes
      }
    })
  }

  rechargerDocuments() {
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
      console.debug("Connexion sur " + namespace);
      socket.emit('documents', this._serialiser());
    })
  }

  _chargementInitial(reponse) {
    console.debug("Reponse requete initiale");
    let messageContent = reponse.content.toString('utf-8');
    let json_message = JSON.parse(messageContent);
    // console.debug(json_message);

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

// class WebSocketResources {
//
//   constructor(socket, etatDocumentsDomaines) {
//     this.socket = socket;
//     this.etatDocumentsDomaines = etatDocumentsDomaines;
//
//     this.domaineCourant = null;
//     this.etatDocumentCourant = null;
//
//     // this._enregistrerEvenements();
//     //
//     // // Bind this
//     // this._chargerDomaine = this._chargerDomaine.bind(this);
//   }
//
//   // _enregistrerEvenements() {
//   //   for(let domaine in this.etatDocumentsDomaines.documents) {
//   //     this.socket
//   //     .of(domaine)
//   //     .on('chargerDomaine', domaine.serialiser)
//   //   }
//   //
//   //   //this.socket.on('chargerDomaine', (event, cb)=>this._chargerDomaine(event, cb));
//   // }
//
//   // _chargerDomaine(event, cb) {
//   //   console.debug("ChargerDomaine");
//   //   console.debug(event);
//   //   this.domaineCourant = event.domaine;
//   //   this.etatDocumentCourant = this.etatDocumentsDomaines.getDocumentsDomaine(this.domaineCourant);
//   //
//   //   // Tranamettre resultat via callback
//   //   let documentsDomaine = this.etatDocumentCourant.serialiser();
//   //   cb(documentsDomaine);
//   // }
//
//   close() {
//     console.debug("Deconnexion " + this.socket.id);
//   }
//
// }

module.exports = {WebSocketVitrineApp}
