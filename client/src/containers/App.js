import React, {Suspense} from 'react'
import './App.css'
import openSocket from 'socket.io-client'
import axios from 'axios'

import {preparerCertificateStore, verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'
import {calculerIdmg} from '@dugrema/millegrilles.common/lib/forgecommon'

import '../components/i18n'
import { withTranslation } from 'react-i18next';

import { SiteAccueil } from './Site'
import { LayoutMillegrilles } from './Layout'

const MG_SOCKETIO_URL = '/vitrine/socket.io',
      MAPPING_PAGES = {SiteAccueil}

class _App extends React.Component {

  state = {
    nomDomaine: '',
    siteConfiguration: '',
    language: '',
    certificateStore: '',
    idmg: '',
    infoVitrine: '',

    err: '',
    page: 'SiteAccueil',

    socket: '',

    manifest: {
      version: 'DUMMY',
      date: 'DUMMY'
    }

  }

  componentDidMount() {
    this.chargerSite()
    this.chargerCertificateStore()
    this.connecterSocketIo()
  }

  async chargerSite() {
    var language = this.props.i18n.language
    const nomDomaine = window.location.href.split('/')[2].split(':')[0]

    // Charger configuration du site associe au domaine
    const siteConfiguration = await _chargerSite(nomDomaine)

    // Identifier le language de depart pour afficher la page
    if(!language) {
      language = siteConfiguration.languages[0]  // Utiliser le language par defaut (1er dans la liste)
      this.props.i18n.changeLanguage(language)
    } else {
      // S'assurer que le language detecte existe pour le site
      if( ! siteConfiguration.languages.includes(language) ) {
        console.debug("Forcer changement de language, celui detecte dans le navigateur n'existe pas")
        language = siteConfiguration.languages[0]  // Utiliser le language par defaut (1er dans la liste)
        this.props.i18n.changeLanguage(language)
      }
    }

    document.title = siteConfiguration.titre[language]
    this.setState({nomDomaine, siteConfiguration, language})
  }


  async chargerCertificateStore() {
    // Preparer le certificate store avec le CA pour valider tous les .json telecharges
    const caPromise = axios.get('/vitrine/millegrille.pem'),
          infoPromise = axios.get('/vitrine/info.json')

    const resultat = await Promise.all([caPromise, infoPromise])

    const caPem = resultat[0].data,
          infoVitrine = resultat[1].data

    // console.debug("Info vitrine : %O", infoVitrine)

    // Valider le idmg - millegrille.pem === info.idmg
    const idmgVitrine = infoVitrine.idmg,
          idmgMillegrille = calculerIdmg(caPem)
    if(idmgVitrine !== idmgMillegrille) {
      throw new Error("Idmg de vitrine sur info.json ne correspond pas a millegrille.pem")
    }

    // console.debug("PEM certificat de millegrille : \n%s", caPem)
    const certificateStore = preparerCertificateStore(caPem)

    // Valider la signatude de info.json
    if( verifierSignatureMessage(infoVitrine, infoVitrine._certificat, certificateStore) ) {
      this.setState({idmg: idmgVitrine, certificateStore})
    } else {
      console.error("Erreur verification info.json - signature invalide")
      this.setState({err: "Erreur verification info.json - signature invalide"})
    }

  }

  connecterSocketIo = () => {
    if( ! this.state.connexionSocketIo ) {
      const socket = openSocket('/', {
        path: MG_SOCKETIO_URL,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      })
      socket.on('disconnect', () => {this.deconnexionSocketIo()})

      socket.on('majSite', this.eventMajSite)
      socket.on('majCollection', this.eventMajCollection)

      // Conserve socket, permet d'enregistrer listeners par component (post, collections, etc.)
      this.setState({socket})

    }
  }

  eventMajSite = site => {
    console.debug("MAJ site %O", site)
    const certificateStore = this.state.certificateStore
    if( verifierSignatureMessage(site, site._certificat, certificateStore) ) {
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
    if(MAPPING_PAGES[value]) {
      this.setState({page: value})
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
    var BaseLayout = LayoutAccueil

    const rootProps = {
      ...this.state,
      changerLanguage: this.changerLanguage,
    }

    var affichage = <p>Connexion en cours</p>
    if(this.state.siteConfiguration && this.state.certificateStore && this.state.page) {
      // BaseLayout = LayoutAccueil
      const Page = MAPPING_PAGES[this.state.page]
      affichage = <Page rootProps={rootProps} />
    }

    return (
      <BaseLayout
        changerPage={this.changerPage}
        affichage={affichage}
        goHome={this.goHome}
        rootProps={rootProps} />
    )
  }
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

async function _chargerSite(domaineUrl, language) {
  const url = '/vitrine/sites/' + domaineUrl + '/index.json'
  const reponse = await axios({method: 'get', url})
  // console.debug("Reponse site : %O", reponse)

  const siteConfiguration = reponse.data

  return siteConfiguration
}
