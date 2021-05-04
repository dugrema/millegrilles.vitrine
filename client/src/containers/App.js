import React, {Suspense, useState, useEffect} from 'react'
import { BrowserRouter, HashRouter, useLocation } from "react-router-dom"
import {Alert} from 'react-bootstrap'
import {getResolver} from '../workers/workers.load'

import '../components/i18n'
import { withTranslation } from 'react-i18next';
import manifest from '../manifest.build.js'
import './App.css'

import ContenuSite from './ContenuSite'
import { LayoutMillegrilles } from './Layout'

const MG_SOCKETIO_URL = '/vitrine/socket.io',
      // MG_INDEX_JSON = '/vitrine/index.json'  // '/./index.json'
      MG_INDEX_JSON = '../../index.json'

var _resolverWorker = null,
    _connexionWorker = null

export default function App(props) {

  const AppWithTranslation = withTranslation()(VitrineApp)

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

function VitrineApp(props) {

  const [siteConfiguration, setSiteConfiguration] = useState('')
  const [language, setLanguage] = useState('')
  const [err, setErr] = useState('')
  // var [Router, setRouter] = useState(BrowserRouter)
  var Router = HashRouter

  // Chargement au demarrage
  useEffect(_=>{
    console.debug("Vitrine version %s, %s", manifest.version, manifest.date)
    chargerSite(props.i18n, setSiteConfiguration, setLanguage, setErr)
  }, [])

  // Toggle type de routage
  useEffect(_=>{
    const siteRoutable = true
    // if(!siteRoutable) setRouter(MemoryRouter)
  }, [siteConfiguration])

  const changerLanguage = event => {
    // console.debug("Changer language : %O\n%O", event, this.props)
    const i18n = props.i18n
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
    props.i18n.changeLanguage(langueProchaine)
    setLanguage(langueProchaine)
  }

  const workers = {
    resolver: _resolverWorker,
  }

  return (
    <>
      <AfficherErreur err={err} />

      <Router>
        <LayoutMillegrilles siteConfiguration={siteConfiguration}
                            language={language}
                            manifest={manifest}>

          <ContenuSite siteConfiguration={siteConfiguration}
                       language={language}
                       workers={workers} />

        </LayoutMillegrilles>
      </Router>
    </>
  )
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

async function chargerSite(i18n, setSiteConfiguration, setLanguage, setErr) {
  console.debug("!!! Page location : %O", window.location)
  try {
    if(!_resolverWorker) {
      // Preparer resolver
      _resolverWorker = (await getResolver()).webWorker
    }

    // Charger configuration du site associe au domaine
    const url = MG_INDEX_JSON
    const siteConfiguration = await _resolverWorker.chargerSiteConfiguration(url)

    // Identifier le language de depart pour afficher la page
    // S'assurer que le language detecte existe pour le site
    var language = i18n.language
    if( ! language || ! siteConfiguration.languages.includes(language) ) {
      // Langague non fourni ou non supporte
      // Utiliser le language par defaut du site (1er dans la liste)
      language = siteConfiguration.languages[0]
      i18n.changeLanguage(language)
    }

    document.title = siteConfiguration.titre[language]
    setSiteConfiguration(siteConfiguration)
    setLanguage(language)
  } catch(err) {
    console.error("Erreur chargement site : %O", err)
    setErr(''+err)
  }
}
