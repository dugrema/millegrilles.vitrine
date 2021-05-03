import React, {Suspense} from 'react'
import {
  BrowserRouter as Router,
  Switch, Route, Link, useParams
} from "react-router-dom"
import {Alert} from 'react-bootstrap'
// import openSocket from 'socket.io-client'

// import {preparerCertificateStore, verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'
// import {verifierIdmg} from '@dugrema/millegrilles.common/lib/idmg'
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
      // await chargerCertificateStore(siteConfiguration)

      // Aucune erreur, on initialiser les CDNs de la connexion
      // Le resolver va immediatement commencer a verifier les sources de contenu
      // _resolverWorker.setSiteConfiguration(siteConfiguration)

      // Identifier le language de depart pour afficher la page
      // S'assurer que le language detecte existe pour le site
      if( ! language || ! siteConfiguration.languages.includes(language) ) {
        // Langague non fourni ou non supporte
        // Utiliser le language par defaut du site (1er dans la liste)
        language = siteConfiguration.languages[0]
        this.props.i18n.changeLanguage(language)
      }

      document.title = siteConfiguration.titre[language]
      this.setState(
        {siteConfiguration, language},
        _=>{
          console.debug("!!! State initial %O", this.state)
        }
      )
    } catch(err) {
      console.error("Erreur chargement site : %O", err)
      this.setState({err: ''+err})
    }
  }

  // changerPage = event => {
  //   const value = event.currentTarget.value
  //   // console.debug("Changer page %s", value)
  //
  //   if(value.startsWith('section:')) {
  //     const idx = Number(value.split(':')[1])
  //     const section = this.state.siteConfiguration.sections[idx]
  //     // Toggle la section, force le rechargement si on a plusieurs sections de meme type
  //     this.setState({section: ''}, _=>{
  //       this.setState({section})
  //     })
  //   } else if(MAPPING_PAGES[value]) {
  //     this.setState({page: value, section: ''})
  //   } else {
  //     throw new Error("Page inconnue : " + value)
  //   }
  // }

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
    const rootProps = {
      ...this.state,
      changerLanguage: this.changerLanguage,
      manifest,
    }

    const siteConfiguration = this.state.siteConfiguration

    return (
      <>
        <AfficherErreur err={this.state.err} />

        <Router>
          <LayoutMillegrilles siteConfiguration={siteConfiguration}
                              // changerPage={props.changerPage}
                              // goHome={this.goHome}
                              rootProps={rootProps}>

            <RouteurSwitch siteConfiguration={siteConfiguration}
                           language={this.state.language}
                           rootProps={rootProps} />

          </LayoutMillegrilles>
        </Router>
      </>
    )
  }
}

function AfficherErreur(props) {
  console.debug("!!! Afficher erreur : %O", props)
  return (
    <Alert show={props.err?true:false} variant="danger">
      <Alert.Heading>
        Site non disponible / Site unavailable
      </Alert.Heading>
      <pre>{props.err}</pre>
    </Alert>
  )
}

function RouteurSwitch(props) {
  return (
    <Switch>
      <Route path="/vitrine/section/:sectionIdx">
        <Section {...props} />
      </Route>
      <Route path="/vitrine/">
        <SiteAccueil {...props} />
      </Route>
      <Route path="/vitrine">
        <SiteAccueil {...props} />
      </Route>
    </Switch>
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
