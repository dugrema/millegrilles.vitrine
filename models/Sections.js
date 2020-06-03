// WebSocket api pour l'application React Vitrine
const debug = require('debug')('millegrilles:vitrine:Sections')
const os = require('os');
const fs = require('fs');
const path = require('path');
const { maj_fichier_data } = require('../util/traitementFichiersData');

const DOCUMENT_VITRINE_ACCUEIL = 'requete.millegrilles.domaines.Plume.chargerAccueil';
const PUBLICATION_DOCUMENT_ACCUEIL = 'commande.publierAccueil';

const DOCUMENT_VITRINE_BLOGS = 'requete.millegrilles.domaines.Plume.chargerBlogpostsRecents';
const PUBLICATION_DOCUMENT_BLOGS = 'commande.publierBlogpostsRecents';

const DOCUMENT_VITRINE_SENSEURSPASSIFS = 'requete.millegrilles.domaines.SenseursPassifs.dashboard';
const PUBLICATION_DOCUMENT_SENSEURSPASSIFS = 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.vitrine.dashboard';

class SectionHandler {

  DELAI_ESSAI_DOCUMENTS = 60000

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
  initialiser(server, amqpdao, nodeId, opts) {
    if(!opts) opts = {}

    this.socketIoConnexion = server
    this.amqpdao = amqpdao
    this.nodeId = nodeId

    // Note : s'assurer d'implementer ces methodes dans les sous-classes
    const nomSection = this.getNomSection()
    const routingKeys = this.getRoutingKeys()

    this.pathData = opts.pathData || path.join('/tmp/vitrine/', nodeId, nomSection)
    const modeErreur = opts.modeErreur || false

    debug("Section %s, modeErreur: %s, pathData: %s, routing keys :", nomSection, modeErreur, this.pathData)
    debug(routingKeys)
    this.amqpdao.routingKeyManager.addRoutingKeyCallback(this.handleMessage, Object.keys(routingKeys), {exchange: '1.public'})

    if(!modeErreur) {
      this.requeteDocuments()
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
            maj_fichier_data(pathFichier, JSON.stringify(reponse));
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
      debug("Activation timer de %d secondes pour charger documents", this.DELAI_ESSAI_DOCUMENTS/1000)
      this.timerChargement = setTimeout(()=>{this.rechargerDocuments()}, this.DELAI_ESSAI_DOCUMENTS);
    }

  }

  handleMessage(routingKey, message, opts) {
    const config = getRoutingKeys()[routingKey]
    if(config) {

      if(config.cleEmit) {
        const cleEmit = config.cleEmit
        this.emit(cle, message)
      }

      if(config.nomFichier) {
        const pathFichier = path.join(this.pathData, config.nomFichier)
        maj_fichier_data(pathFichier, JSON.stringify(reponse));
      }

    } else {
      console.warning("Recu routing key inconnue : %s", routingKey)
    }
  }

  emit(cle, message) {
    const nomSection = getNomSection()
    this.socketIoConnexion.to(nomSection).emit(cle, message)
  }

  rechargerDocuments() {
    console.info("Tentative de rechargement des documents")
    if(this.timerChargement) {
      clearTimeout(this.timerChargement)
      this.timerChargement = null
    }
    this.requeteDocuments()
  }

}

class VitrineGlobal extends SectionHandler {
  NOM_SECTION = 'global'

  ROUTING_KEYS = {
    // 'evenement.Annuaire.document.fichePublique': {
    //   nomFichier: 'fichePublique.json',
    //   requete: 'Annuaire.fichePublique',
    //   cleEmit: 'fichePublique',
    // },
    'evenement.Parametres.document.configurationNoeudPublic': {
      nomFichier: 'configuration.json',
      requete: 'Parametres.noeudPublic',
      requeteParametres: {uuid_noeud: 'DUMMY'},
      cleEmit: 'configuration',
    },
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  getRoutingKeys() {
    return this.ROUTING_KEYS
  }
}

// class SectionAccueil extends SectionHandler {
//
//   NOM_SECTION = 'accueil'
//   ROUTING_KEYS = {
//
//   }
//
//   getNomSection() {
//     return NOM_SECTION
//   }
//
//   getRoutingKeys() {
//     return ROUTING_KEYS
//   }
//
// }
//
// class SectionBlogs extends SectionHandler {
//
//   constructor() {
//     super();
//     this.name = 'blogs';
//   }
//
//   getCommandePublier() {
//     return PUBLICATION_DOCUMENT_BLOGS;
//   }
//
//   getRoutingRequeteInitiale() {
//     return DOCUMENT_VITRINE_BLOGS;
//   }
//
// }
//
// class SectionSenseursPassifs extends SectionHandler {
//
//   constructor() {
//     super();
//     this.name = 'senseursPassifs';
//   }
//
//   getCommandePublier() {
//     return PUBLICATION_DOCUMENT_SENSEURSPASSIFS;
//   }
//
//   getRoutingRequeteInitiale() {
//     return DOCUMENT_VITRINE_SENSEURSPASSIFS;
//   }
//
// }

module.exports = {VitrineGlobal} // SectionAccueil, SectionBlogs, SectionSenseursPassifs}
