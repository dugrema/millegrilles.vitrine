const rabbitMQ = require('../util/rabbitMQ');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { maj_fichier_data } = require('./traitementFichiersData');

const REQUETE_ANNONCES_RECENTES = 'requete.millegrilles.domaines.Plume.chargerAnnoncesRecentes'
const MESSAGE_ANNONCES = 'noeuds.source.millegrilles_domaines_Plume.documents.annonces.recentes';
const FICHIER_MESSAGES = 'messages.json';

class SectionMessagesSockets {

  constructor() {
    this.name = 'messages';

    this.wssConnexion = null;

    this.dateChargement = null;
    this.timerChargement = null;
    this.pathData = null;

    this.routingKeys = {};
    this.routingKeys[MESSAGE_ANNONCES] = true;

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
      console.warn("Messages: Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 60000);
    }
  }

  emit(cle, message) {
    // Faire l'entretien du document local
    if(message.routingKey === MESSAGE_ANNONCES) {
      if(message.message && message.message.annonces) {
        const annoncesRecentes = message.message;
        this.wssConnexion.emit('contenu', annoncesRecentes);  // Cle pour la section

        maj_fichier_data(
          path.join(this.pathData, FICHIER_MESSAGES),
          JSON.stringify(annoncesRecentes)
        );
      }
    }
  }

  requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    if(!this.timerChargement) {
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, 30000);  // Ressayer dans 30 secondes
    }

    // Document milleGrille
    var routingRequeteMilleGrilleInitiale = REQUETE_ANNONCES_RECENTES;
    rabbitMQ.transmettreRequete(routingRequeteMilleGrilleInitiale, {})
    .then(reponse=>{
      if(this.timerChargement) {
        clearTimeout(this.timerChargement);
        this.timerChargement = null;
      }

      // Extraire l'element resultats de la reponse
      let messageContent = reponse.content.toString('utf-8');
      let jsonMessage = JSON.parse(messageContent);
      const resultats = jsonMessage.resultats;

      if(resultats.annonces) {
        console.debug("Reponse " + FICHIER_MESSAGES + ", sauvegarde sous " + this.pathData);
        maj_fichier_data(
          path.join(this.pathData, FICHIER_MESSAGES),
          JSON.stringify(resultats)
        );
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
    let namespace = '/messages';
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

module.exports = {SectionMessagesSockets}
