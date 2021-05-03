import React, {Suspense} from 'react'
import {BrowserRouter as Router} from "react-router-dom"
import {Alert} from 'react-bootstrap'
import {getResolver} from '../workers/workers.load'

import '../components/i18n'
import { withTranslation } from 'react-i18next';
import manifest from '../manifest.build.js'
import './App.css'

import ContenuSite from './ContenuSite'
import { LayoutMillegrilles } from './Layout'

const MG_SOCKETIO_URL = '/vitrine/socket.io'

var _resolverWorker = null,
    _connexionWorker = null

class _App extends React.Component {

  state = {
    siteConfiguration: '',

    language: '',
    err: '',
  }

  componentDidMount() {
    console.debug("Vitrine version %s, %s", manifest.version, manifest.date)
    this.chargerSite()
  }

  async chargerSite() {
    try {
      var language = this.props.i18n.language

      if(!_resolverWorker) {
        // Preparer resolver
        _resolverWorker = (await getResolver()).webWorker
      }

      // Charger configuration du site associe au domaine
      const siteConfiguration = await _chargerSite()

      // Identifier le language de depart pour afficher la page
      // S'assurer que le language detecte existe pour le site
      if( ! language || ! siteConfiguration.languages.includes(language) ) {
        // Langague non fourni ou non supporte
        // Utiliser le language par defaut du site (1er dans la liste)
        language = siteConfiguration.languages[0]
        this.props.i18n.changeLanguage(language)
      }

      document.title = siteConfiguration.titre[language]
      this.setState({siteConfiguration, language})
    } catch(err) {
      console.error("Erreur chargement site : %O", err)
      this.setState({err: ''+err})
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
    const workers = {
      resolver: _resolverWorker,
    }

    const siteConfiguration = this.state.siteConfiguration

    return (
      <>
        <AfficherErreur err={this.state.err} />

        <Router>
          <LayoutMillegrilles siteConfiguration={siteConfiguration}
                              language={this.state.language}
                              manifest={manifest}>

            <ContenuSite siteConfiguration={siteConfiguration}
                         language={this.state.language}
                         workers={workers} />

          </LayoutMillegrilles>
        </Router>
      </>
    )
  }
}

function AfficherErreur(props) {
  return (
    <Alert show={props.err?true:false} variant="danger">
      <Alert.Heading>
        Site non disponible / Site unavailable
      </Alert.Heading>
      <pre>{props.err}</pre>
    </Alert>
  )
}

const AppWithTranslation = withTranslation()(_App)

export default function App(props) {
  return (
    <Suspense fallback={<ChargementEnCours/>}>
      <AppWithTranslation />
    </Suspense>
  )
}

function ChargementEnCours(props) {
  return (
    <>
      <p>Loading in progress</p>
      <p>Chargement en cours</p>
      <p>
        <i className="fa fa-refresh fa-spin fa-fw"/>
      </p>
    </>
  )
}

async function _chargerSite() {
  const url = '/vitrine/index.json'
  const siteConfig = await _resolverWorker.chargerSiteConfiguration(url)
  return siteConfig
}
