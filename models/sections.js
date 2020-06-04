// WebSocket api pour l'application React Vitrine
const debug = require('debug')('millegrilles:vitrine:sections')
const os = require('os');
const fs = require('fs');
const path = require('path');
const { maj_fichier_data } = require('../util/traitementFichiersData');

const EXCHANGE_PUBLIC = '1.public'
DELAI_ESSAI_DOCUMENTS = 60000

class SectionHandler {

  constructor() {
    this.amqpdao = null
    this.socketIoConnexion = null
    this.dateChargement = null
    this.timerChargement = null
    this.pathData = null
    this.webUrl = null

    // RoutingKeys sert a configurer les evenements recus.
    // Permet aussi d'initialiser les documents au demarrage
    //   'evenement.DOMAINE.ACTION.cleDocument' : {
    //      nomFichier: 'accueil.json',
    //      requete: 'requete.Posteur.chargerAccueil',
    //      cleEmit: ''
    //   }

    // this.initialiser = this.initialiser.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
  }

  getNomSection() {
    throw new Error("Pas implemente")
  }

  getRoutingKeys() {
    throw new Error("Pas implemente")
  }

  // Initialiser la section
  //   - server : Instance socket.io (socketio())
  //   - amqpdao : Instance de RabbitMQ (common)
  //   - nodeId : id unique du noeud dans la millegrille
  //   - opts : {
  //       modeErreur: bool,
  //       pathData: str,
  //     }
  async initialiser(server, amqpdao, uuidNoeud, opts) {
    if(!opts) opts = {}

    this.socketIoConnexion = server
    this.amqpdao = amqpdao
    this.uuidNoeud = uuidNoeud
    this.idmg = amqpdao.pki.idmg

    // Note : s'assurer d'implementer ces methodes dans les sous-classes
    const nomSection = this.getNomSection()
    const routingKeys = this.getRoutingKeys()

    this.pathData = path.join(opts.pathData, this.idmg, nomSection)
    const modeErreur = opts.modeErreur || false

    debug("Section %s, modeErreur: %s, pathData: %s, routing keys :", nomSection, modeErreur, this.pathData)
    debug(routingKeys)
    this.amqpdao.routingKeyManager.addRoutingKeyCallback(this.handleMessage, Object.keys(routingKeys), {exchange: EXCHANGE_PUBLIC})

    if(!modeErreur) {
      await this.requeteDocuments()
    } else {
      // On va attendre avant de charger les documents. Le system est probablement
      // en initialisation/reboot.
      console.warn(this.name + ": Attente avant du chargement des documents (60s)");
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, DELAI_ESSAI_DOCUMENTS);
    }
  }

  async requeteDocuments() {
    // Effectuer les requetes et conserver localement les resultats
    const routingKeys = this.getRoutingKeys()

    var erreurDocument = false

    try {
      for(let routingKey in routingKeys) {
        const config = routingKeys[routingKey]
        if(config.requete) {
          const domaineAction = config.requete

          debug("Requete vers %s", domaineAction)
          const parametres = config.requeteParametres || {}
          try {
            const reponse = await this.amqpdao.transmettreRequete(domaineAction, parametres)

            debug("Reponse %s :", domaineAction)
            debug(reponse)

            const pathFichier = path.join(this.pathData, config.nomFichier)
            debug("MAJ Fichier %s", pathFichier)
            await maj_fichier_data(pathFichier, JSON.stringify(reponse));
          } catch(err) {
            console.error("Erreur transmission requete %s", routingKey)
            console.error(err)
            erreurDocument = true
          }

        }
      }
    } catch(err) {
      console.error("Erreur chargement documents")
      console.error(err)
      erreurDocument = true
    }

    if(erreurDocument) {
      debug("Activation timer de %d secondes pour charger documents", DELAI_ESSAI_DOCUMENTS/1000)
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, DELAI_ESSAI_DOCUMENTS);
    }

  }

  async handleMessage(routingKey, message, opts) {
    debug("Message MQ %s", routingKey)
    debug(message)

    try {
      const routingKeys = this.getRoutingKeys()
      const config = routingKeys[routingKey]

      if(config) {
        if(config.nomFichier) {
          const pathFichier = path.join(this.pathData, config.nomFichier)
          debug("Sauvegarde message dans %s", pathFichier)
          maj_fichier_data(pathFichier, JSON.stringify(message))
        }

        if(config.cleEmit) {
          const cleEmit = config.cleEmit
          this.emit(cleEmit, {routingKey, message, cleEmit})
        }

      } else {
        console.warning("Recu routing key inconnue : %s", routingKey)
      }
    } catch(err) {
      console.error("Erreur handleMessage sur %s", routingKey)
      console.error(err)
    }
  }

  emit(cle, message) {
    const nomSection = this.getNomSection()
    debug("Emission message sur Socket.IO, room: %s, cle: %s", nomSection, cle)
    this.socketIoConnexion.to(nomSection).emit(cle, message)
  }

  async rechargerDocuments() {
    console.info("Tentative de rechargement des documents")
    if(this.timerChargement) {
      clearTimeout(this.timerChargement)
      this.timerChargement = null
    }
    await this.requeteDocuments()
  }

}

module.exports = { SectionHandler }
