const { SectionHandler } = require('./sections')

class VitrineGlobal extends SectionHandler {
  NOM_SECTION = 'global'

  initialiser(server, amqpdao, uuidNoeud, opts) {
    const routingNoeudPublic = 'evenement.Parametres.noeudPublic.' + uuidNoeud
    this.routingKeys = {
      'evenement.Annuaire.document.fichePublique': {
        nomFichier: 'fichePublique.json',
        requete: 'Annuaire.fichePublique',
        cleEmit: 'fichePublique',
      },
      [routingNoeudPublic]: {
        nomFichier: 'configuration.json',
        requete: 'Parametres.noeudPublic',
        requeteParametres: {uuidNoeud},
        cleEmit: 'configuration',
      },
    }

    super.initialiser(server, amqpdao, uuidNoeud, opts)
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  getRoutingKeys() {
    return this.routingKeys
  }
}

class SectionAccueil extends SectionHandler {

  NOM_SECTION = 'accueil'

  ROUTING_KEYS = {
    'evenement.Posteur.document.vitrine_accueil': {
      nomFichier: 'accueil.json',
      requete: 'Posteur.chargerAccueil',
      cleEmit: 'accueil',
    },
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  getRoutingKeys() {
    return this.ROUTING_KEYS
  }

}

class SectionBlogs extends SectionHandler {

  NOM_SECTION = 'blogs'

  ROUTING_KEYS = {
    'evenement.Posteur.document.vitrine_blogs': {
      nomFichier: 'blogs.json',
      requete: 'Posteur.chargerBlogposts',
      cleEmit: 'blogs',
    },
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  getRoutingKeys() {
    return this.ROUTING_KEYS
  }

}

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

module.exports = { VitrineGlobal, SectionAccueil, SectionBlogs }
