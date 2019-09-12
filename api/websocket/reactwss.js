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
    rabbitMQ.routingKeyManager.addRoutingKeysForSocket(this.wssConnexion, Object.keys(this.routingKeys));

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
    })
  }

  _serialiser() {
    return {noeuds: this.noeuds, senseurs: this.senseurs};
  }

  _enregistrerEvenements(server) {
    this.wssConnexion = server;
    let namespace = '/senseursPassifs';
    console.debug("Initialisation namespace " + namespace);
    server.of(namespace).on('connection', socket=>{
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
      this.noeuds[noeud.noeud] = noeud;
      // console.debug(noeud);
    }

    for(let idx in requeteSenseurs) {
      let senseur = requeteSenseurs[idx];
      this.senseurs[senseur.senseur + '@' + senseur.noeud] = senseur;
      // console.debug(senseur);
    }

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
