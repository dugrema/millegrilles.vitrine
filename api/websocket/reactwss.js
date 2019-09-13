// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');

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
      senseursPassifs: new SenseursPassifsDomaine(),
    }

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, modeErreur) {
    console.debug("Initialiser domaines, modeErreur:" + modeErreur);

    for(let domaine in this.domaines) {
      console.debug("Initialiser domaine " + domaine);
      this.domaines[domaine].initialiser(server, modeErreur);
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

  initialiser(server, modeErreur) {
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
