// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { maj_fichier_data } = require('./traitementFichiersData');

const DOCUMENT_VITRINE_ACCUEIL = 'requete.millegrilles.domaines.Plume.chargerAccueil';
const PUBLICATION_DOCUMENT_ACCUEIL = 'commande.publierAccueil';

class SectionAccueil {

  constructor() {
    this.name = 'accueil';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;
    this.webUrl = null;
    this.commandePublierAlbums = null;

    this.routingKeys = {};
    this.routingKeys[PUBLICATION_DOCUMENT_ACCUEIL] = true;

    this.initialiser = this.initialiser.bind(this);
  }

  initialiser(server, opts, modeErreur) {
    // console.debug("init albums")
    // console.debug(opts);

    this.webUrl = opts.webUrl;

    let webUrlFormatte = this.webUrl.replace(/\./g, '_');
    this.commandePublier = PUBLICATION_DOCUMENT_ACCUEIL;
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
    console.debug("Section " + this.name + " Recu message " + cle);

    // Faire l'entretien du document local
    if(message.routingKey === this.commandePublier) {
      this.wssConnexion.emit('contenu', message);
      maj_fichier_data(
        path.join(this.pathData, 'accueil.json'),
        JSON.stringify(message.message)
      );
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    var routingRequeteInitiale = DOCUMENT_VITRINE_ACCUEIL;
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
      console.debug("Reponse accueil.json, sauvegarde sous " + this.pathData);

      maj_fichier_data(
        path.join(this.pathData, 'accueil.json'),
        JSON.stringify(resultats)
      );

      return Object.keys(collections);
    })
    .catch(err=>{
      console.info("Erreur chargement, on va ressayer plus tard");
      console.error(err);
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

module.exports = {SectionAccueil}
