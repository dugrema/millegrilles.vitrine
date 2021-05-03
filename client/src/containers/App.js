import React, {Suspense} from 'react'
import {
  BrowserRouter as Router,
  Switch, Route, Link, useParams
} from "react-router-dom"
import {Alert} from 'react-bootstrap'
// import openSocket from 'socket.io-client'

import {preparerCertificateStore, verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'
import {verifierIdmg} from '@dugrema/millegrilles.common/lib/idmg'
import {getResolver} from '../workers/workers.load'

import '../components/i18n'
import { withTranslation } from 'react-i18next';

import { SiteAccueil } from './Site'
import { LayoutMillegrilles } from './Layout'

// import { Section } from './Sections'

import manifest from '../manifest.build.js'

import './App.css'

const Section = React.lazy(_=>{import('./Sections')})

const MG_SOCKETIO_URL = '/vitrine/socket.io',
      MAPPING_PAGES = {SiteAccueil}

class _App extends React.Component {

  state = {
    nomDomaine: '',
    siteConfiguration: '',
    language: '',
    certificateStore: '',
    idmg: '',

    err: '',
    section: '',
    page: 'SiteAccueil',

    resolverWorker: '',
    socket: '',
  }

  componentDidMount() {
    console.debug("Vitrine version %s, %s", manifest.version, manifest.date)
    this.chargerSite()
  }

  async chargerSite() {
    var language = this.props.i18n.language

    var resolverWorker = this.state.resolverWorker
    if(!resolverWorker) {
      // Preparer resolver
      resolverWorker = (await getResolver()).webWorker
      this.setState({resolverWorker})
    }

    // Charger configuration du site associe au domaine
    const siteConfiguration = await _chargerSite(resolverWorker)
    console.debug("!!! Configuration site (index.json): %O", siteConfiguration)
    const {idmg, certificateStore} = await chargerCertificateStore(siteConfiguration)

    // Identifier le language de depart pour afficher la page
    // S'assurer que le language detecte existe pour le site
    if( ! language || ! siteConfiguration.languages.includes(language) ) {
      // Langague non fourni ou non supporte
      // Utiliser le language par defaut du site (1er dans la liste)
      language = siteConfiguration.languages[0]
      this.props.i18n.changeLanguage(language)
    }

    document.title = siteConfiguration.titre[language]
    this.setState({siteConfiguration, language, certificateStore}, _=>{console.debug("!!! State initial %O", this.state)})
  }

  connecterSocketIo = () => {
    if( ! this.state.connexionSocketIo ) {
      // const socket = openSocket('/', {
      //   path: MG_SOCKETIO_URL,
      //   reconnection: true,
      //   reconnectionAttempts: 5,
      //   reconnectionDelay: 500,
      //   reconnectionDelayMax: 30000,
      //   randomizationFactor: 0.5
      // })
      // socket.on('disconnect', () => {this.deconnexionSocketIo()})
      //
      // socket.on('majSite', this.eventMajSite)
      // socket.on('majCollection', this.eventMajCollection)
      //
      // // Conserve socket, permet d'enregistrer listeners par component (post, collections, etc.)
      // this.setState({socket})

    }
  }

  eventMajSite = async site => {
    console.debug("MAJ site %O", site)
    const certificateStore = this.state.certificateStore
    if( await verifierSignatureMessage(site, site._certificat, certificateStore) ) {
      this.setState({siteConfiguration: site})
    }
  }

  eventMajCollection = collection => {
    console.debug("MAJ collection %O", collection)
  }

  deconnexionSocketIo = () => {
    console.debug("Deconnexion Socket.IO")
  }

  changerPage = event => {
    const value = event.currentTarget.value
    // console.debug("Changer page %s", value)

    if(value.startsWith('section:')) {
      const idx = Number(value.split(':')[1])
      const section = this.state.siteConfiguration.sections[idx]
      // Toggle la section, force le rechargement si on a plusieurs sections de meme type
      this.setState({section: ''}, _=>{
        this.setState({section})
      })
    } else if(MAPPING_PAGES[value]) {
      this.setState({page: value, section: ''})
    } else {
      throw new Error("Page inconnue : " + value)
    }
  }

  changerLanguage = event => {
    // console.debug("Changer language : %O\n%O", event, this.props)
    const i18n = this.props.i18n,
          siteConfiguration = this.state.siteConfiguration
    const langueCourante = i18n.language
    var langueProchaine = ''

    // Trouver les language dans le site, toggle si juste 2
    const languagesSite = siteConfiguration.languages
    const languesDifferentes = languagesSite.filter(langue=>langue!==langueCourante)
    if(languesDifferentes.length === 1) {
      // Une seule langue differente, on la choisit
      langueProchaine = languesDifferentes[0]
    } else {
      throw new Error("Langue switch - plusieurs langues candidates, il faut choisir")
    }

    document.title = siteConfiguration.titre[langueProchaine]
    this.props.i18n.changeLanguage(langueProchaine)
    this.setState({language: langueProchaine})
  }

  render() {
    return <p>Allo!</p>
  }

  // render() {
  //   var BaseLayout = LayoutAccueil
  //
  //   if(this.state.err) {
  //     return (
  //       <Alert variant="danger">
  //         <Alert.Heading>
  //           Site non disponible / Site unavailable
  //         </Alert.Heading>
  //         {this.state.err}
  //       </Alert>
  //     )
  //   }
  //
  //   const rootProps = {
  //     ...this.state,
  //     changerLanguage: this.changerLanguage,
  //     manifest,
  //   }
  //
  //   var affichage = <p>Connexion en cours</p>
  //   if(this.state.siteConfiguration && this.state.certificateStore && this.state.page) {
  //     affichage = (
  //       <RouteurSwitch rootProps={rootProps} />
  //     )
  //   }
  //
  //   return (
  //     <Router>
  //       <BaseLayout
  //         changerPage={this.changerPage}
  //         affichage={affichage}
  //         goHome={this.goHome}
  //         rootProps={rootProps} />
  //     </Router>
  //   )
  // }
}

function RouteurSwitch(props) {
  const rootProps = props.rootProps
  // console.debug("RouterSwitch: %O", props)
  return (
    <Switch>
      <Route path="/vitrine/section/:sectionIdx">
        <Section rootProps={rootProps} />
      </Route>
      <Route path="/vitrine/">
        <SiteAccueil rootProps={rootProps} />
      </Route>
      <Route path="/vitrine">
        <SiteAccueil rootProps={rootProps} />
      </Route>
    </Switch>
  )

}

const AppWithTranslation = withTranslation()(_App)

export default function App(props) {
  return (
    <Suspense fallback={<p>Loading</p>}>
      <AppWithTranslation />
    </Suspense>
  )
}

// Layout general de l'application
function LayoutAccueil(props) {

  return (
    <LayoutMillegrilles
      changerPage={props.changerPage}
      page={props.affichage}
      goHome={props.goHome}
      sousMenuApplication={props.sousMenuApplication}
      rootProps={props.rootProps} />
  )

}

async function _chargerSite(resolverWorker) {
  const url = '/vitrine/index.json'
  const reponse = await resolverWorker.resolveUrl(url)
  return reponse.data
}

async function chargerCertificateStore(siteConfiguration) {
  // Preparer le certificate store avec le CA pour valider tous les .json telecharges
  const caPem = [...siteConfiguration['_certificat']].pop()  // Dernier certificat dans la liste

  // Valider le idmg - millegrille.pem === info.idmg
  const idmg = siteConfiguration['en-tete'].idmg
  verifierIdmg(idmg, caPem)
  console.debug("IDMG verifie OK avec PEM = %s", idmg)

  try {
    const certificateStore = preparerCertificateStore(caPem)

    // Valider la signature de index.json (siteConfiguration)
    let signatureValide = await verifierSignatureMessage(
      siteConfiguration, siteConfiguration._certificat, certificateStore)

    if(!signatureValide) {
      console.error("Erreur verification info.json - signature invalide")
      throw new Error("Erreur verification info.json - signature invalide")
    }

    return {idmg, certificateStore}
  } catch(err) {
    console.error("Erreur verification certificats/info.json : %O", err)
    throw new Error("Erreur verification info.json - date certificat ou signature invalide")
  }

}

async function preparerResolverWorker() {
  // Importer le resolver de ressources

  const resolverWorker = await import('./resolverRessources')

}
