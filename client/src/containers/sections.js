import React from 'react'
import axios from 'axios'
import path from 'path'
import { Trans } from 'react-i18next';

export class SectionVitrine extends React.Component {

  state = {
    contenu: null,
  }

  // constructor(props) {
  //   super(props);
  //
  //   this.state = {
  //     contenu: null,
  //   }
  // }

  // Configuration des documents et evenements
  // 'cleEmit': {
  //    pathFichier: 'annonces/annonces.json',
  //  }
  getConfigDocuments() {
    throw new Error("Not implemented")
  }

  getNomSection() {
    throw new Error("Not implemented")
  }

  componentDidMount() {
    const idmg = this.props.rootProps.idmg
    console.debug("Charger section avec idmg %s", idmg)
    _chargerDocuments(this.getConfigDocuments(), idmg)
      .then(docs=>this.chargerDocuments(docs))
      .catch(this.erreurChargementDocuments)
  }

  componentWillUnmount() {
    // this.webSocketHandler.deconnecter();
    const clesEmit = Object.keys(this.getConfigDocuments())
    this.props.rootProps.websocketApp.arreterEcouteSection(this.getNomSection(), clesEmit)
  }

  chargerDocuments(docs) {
    console.debug("Documents charges")
    console.debug(docs)

    // Faire expansion des documents sous state, conserver par "cleEmit"
    this.setState({...docs})

    const clesEmit = Object.keys(this.getConfigDocuments())
    this.props.rootProps.websocketApp.ecouterSection(this.getNomSection(), clesEmit, r=>this.handleMessage(r))
  }

  erreurChargementDocuments(err) {
    console.error("Erreur chargement documents")
    console.error(err)
  }

  handleMessage({message, routingKey, cleEmit}) {
    console.debug(message)
    console.debug("Message section %s recu, routingKey: %s, cleEmit", this.getNomSection(), routingKey, cleEmit)

    const configKey = this.getConfigDocuments()[cleEmit]
    if(configKey) {
      this.setState({[cleEmit]: message})
    } else {
      console.error("Message cleEmit %s inconnu. Config : ", cleEmit)
      console.debug(this.getConfigDocuments())
    }
  }

  // renderDateModifiee(dateModifieeEpoch) {
  //   const anneeCourante = new Date().getFullYear();
  //   const dateModifiee = new Date(dateModifieeEpoch * 1000);
  //   let labelDate;
  //   if(dateModifiee.getFullYear() === anneeCourante) {
  //     labelDate = 'accueil.dateModifiee';
  //   } else {
  //     labelDate = 'accueil.dateAnneeModifiee';
  //   }
  //
  //   var dateElement = (
  //     <div className="date-message">
  //       <div className="date-modifiee">
  //         <Trans values={{date: dateModifiee}}>{labelDate}</Trans>
  //       </div>
  //       <div className="heure-modifiee">
  //         <Trans values={{date: dateModifiee}}>accueil.heureModifiee</Trans>
  //       </div>
  //     </div>
  //   )
  //
  //   return dateElement;
  // }

}

// export class CollectionVitrine extends React.Component {
//
//   state = {
//     contenu: null,
//   };
//
//   componentDidMount() {
//     this._chargerCollection(this.getUuid());
//   }
//
//   // Charge le fichier json qui s'occupe du contenu de cette page
//   // libelle: Nom dans localStorage (e.g. page.accueil)
//   // url: URL relatif sur le serveur (e.g. /defaut/accueil.json)
//   _chargerCollection(libelle) {
//     let contenuPageStr = sessionStorage.getItem(libelle);
//
//     const headers = {};
//     if(contenuPageStr) {
//       const contenu = JSON.parse(contenuPageStr);
//       this.setState({contenu: contenu.contenu});
//
//       let lastModified = contenu.lastModified;
//       if(lastModified) {
//         headers['If-Modified-Since'] = lastModified;
//       }
//     }
//
//     // Tenter de charger une version mise a jour a partir du serveur
//     axios.get('/data/collections/' + this.getUuid() + '.json', {
//       headers,
//       validateStatus: status=>{return status === 200 || status === 304}
//     })
//     .then(resp=>{
//       // console.debug(resp);
//       if(resp.status === 200) {
//         // Sauvegarder le contenu mis a jour localement
//         const contenuPage = resp.data;
//         const contenu = {
//           contenu: contenuPage,
//           lastModified: resp.headers['last-modified'],
//         }
//         this.setState({contenu: contenuPage});
//         sessionStorage.setItem(libelle, JSON.stringify(contenu));
//       }
//     })
//     .catch(err=>{
//       console.error("Erreur acces collection " + libelle);
//       console.error(err);
//     })
//
//   }
//
// }

async function _chargerDocuments(configuration, idmg) {

  const docs = {}
  try {
    for(let cleEmit in configuration) {
      const config = configuration[cleEmit]
      var pathFichier = config.pathFichier

      if(pathFichier) {
        pathFichier = path.join('/vitrine/data', idmg, pathFichier)
        console.debug("Chargement fichier %s", pathFichier)

        await axios.get(pathFichier)
          .then(response=>{
            if(response.status === 200) {
              console.debug(response)
              docs[cleEmit] = response.data
            } else {
              console.error("Erreur chargement fichier %s, status %d", path, response.status)
            }
          })
          .catch(err=>{
            console.error("Erreur chargement %s", pathFichier)
            console.error(err)
          })

      }
    }
  } catch(err) {
    console.error("Erreur traitement configuration sous _chargerDocuments")
    console.error(err)
  }

  return docs
}
