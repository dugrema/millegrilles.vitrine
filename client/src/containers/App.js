import React, {Suspense, useState, useEffect, useTransition} from 'react'
import { HashRouter as Router } from "react-router-dom"
import {Alert} from 'react-bootstrap'
import { proxy as comlinkProxy } from 'comlink'
import {getResolver, getConnexion} from '../workers/workers.load'

import '../components/i18n'
import { withTranslation } from 'react-i18next';
import manifest from '../manifest.build.js'
import './App.css'

import ContenuSite from './ContenuSite'
import { LayoutMillegrilles } from './Layout'

console.info("Vitrine version %s, %s", manifest.version, manifest.date)

const MG_INDEX_JSON = '../../index.json'

var _resolverWorker = null,
    _connexionWorker = null,
    _proxySetSiteConfiguration = null,
    _estampilleCourante = 0,
    _majSiteConfiguration = null,
    _majSection = null

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
  const [urlSocketio, setUrlSocketio] = useState('')
  const [language, setLanguage] = useState('')
  const [err, setErr] = useState('')
  const [contenuSection, setContenuSection] = useState('')

  _majSiteConfiguration = siteConfigurationRecue => {
    traiterConfiguration(siteConfigurationRecue, setSiteConfiguration, setLanguage, setUrlSocketio, props.i18n)
  }
  _majSection = evenementSection => {
    traiterSection(evenementSection, contenuSection, setContenuSection)
  }

  // Chargement au demarrage
  useEffect(_=>{
    _proxySetSiteConfiguration = comlinkProxy(_majSiteConfiguration)
    chargerSite(_proxySetSiteConfiguration, setLanguage, setErr)
  }, [props.i18n])

  // Chargement de socketIo (optionnel)
  useEffect(_=>{connecterSocketio(urlSocketio)}, [urlSocketio])

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
                       contenuSection={contenuSection}
                       setContenuSection={setContenuSection}
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

async function chargerSite(setSiteConfiguration, setLanguage, setErr) {
  // console.debug("Page location : %O", window.location)
  const locationString = window.location.href
  try {
    if(!_resolverWorker) {
      // Preparer resolver
      _resolverWorker = (await getResolver()).webWorker
    }

    // Charger configuration du site associe au domaine
    const urlMapping = MG_INDEX_JSON
    const mapping = await _resolverWorker.chargerMappingSite(urlMapping)
    console.debug("Mapping site : %O", mapping)

    const matchSites = Object.keys(mapping.sites).filter(item=>{
      return locationString.startsWith(item)
    })

    let siteChoisi
    if(matchSites.length > 0) {
      const siteHref = matchSites[0]
      siteChoisi = mapping.sites[siteHref]
    } else {
      siteChoisi = mapping.site_defaut
    }
    console.debug("Site choisi: %O", siteChoisi)

    // Charger la configuraiton - transmise via callback setSiteConfiguration
    await _resolverWorker.chargerSiteConfiguration(mapping.cdns, siteChoisi, setSiteConfiguration)
  } catch(err) {
    console.error("Erreur chargement site : %O", err)
    setErr(''+err)
  }
}

async function connecterSocketio(urlSocketio) {
  if(!urlSocketio) return

  if(!_connexionWorker) {
    _connexionWorker = (await getConnexion()).webWorker
    _connexionWorker.setResolverWorker(_resolverWorker)
    _connexionWorker.setCallbacks(
      comlinkProxy(siteConfigMaj),
      comlinkProxy(sectionMaj),
      comlinkProxy(setEtatConnexion)
    )
  }

  console.debug("Tenter une connexion a socket.io")
  _connexionWorker.connecter(urlSocketio)
}

function traiterConfiguration(siteConfigurationRecue, setSiteConfiguration, setLanguage, setUrlSocketio, i18n) {
  const estampilleRecue = siteConfigurationRecue['en-tete'].estampille
  // const estampilleCourante = siteConfiguration?siteConfiguration['en-tete'].estampille:0
  if(estampilleRecue > _estampilleCourante) {
    console.debug("MAJ site configuration (%d>%d) : %O", estampilleRecue, _estampilleCourante, siteConfigurationRecue)
    _estampilleCourante = estampilleRecue
    setSiteConfiguration(siteConfigurationRecue)
    _resolverWorker.appliquerSiteConfiguration(siteConfigurationRecue)

    // Identifier le language de depart pour afficher la page
    // S'assurer que le language detecte existe pour le site
    // const i18n = props.i18n
    var language = i18n.language
    if( ! language || ! siteConfigurationRecue.languages.includes(language) ) {
      // Langague non fourni ou non supporte
      // Utiliser le language par defaut du site (1er dans la liste)
      language = siteConfigurationRecue.languages[0]
      i18n.changeLanguage(language)
    }

    document.title = siteConfigurationRecue.titre[language]
    // setSiteConfiguration(siteConfiguration)
    setLanguage(language)

    if(siteConfigurationRecue.listeSocketio && siteConfigurationRecue.listeSocketio[0]) {
      const url = siteConfigurationRecue.listeSocketio[0]
      console.debug("Set URL socketio : %O", url)
      setUrlSocketio(url)
    }

  }
}

function traiterSection(evenementSection, contenuSection, setContenuSection) {
  console.debug("App.traiterSection : evenementSection: %O, contenuSection: %O", evenementSection, contenuSection)
  if(!contenuSection || !evenementSection) return

  const estampilleRecue = evenementSection.estampille,
        estampilleCourante = contenuSection['en-tete'].estampille,
        typeSectionRecue = evenementSection.type_section,
        typeSectionCourante = contenuSection.type_section

  if(typeSectionRecue === typeSectionCourante && estampilleCourante < estampilleRecue) {
    if(typeSectionRecue === 'collection_fichiers') {
      const uuidRecu = evenementSection.uuid,
            uuidCourant = contenuSection.uuid
      if(uuidRecu === uuidCourant) {
        console.debug("Trigger reload collection fichiers %s", uuidRecu)
        setContenuSection('')  // Clear, va indiquer a la section qu'il fait faire un reload
      }
    } else {
      const sectionIdRecu = evenementSection.section_id
      const sectionIdCourant = contenuSection.section_id
      if(sectionIdRecu === sectionIdCourant) {
        console.debug("Trigger reload section %s", sectionIdRecu)
        setContenuSection('')  // Clear, va indiquer a la section qu'il fait faire un reload
      }
    }
  }
}

async function siteConfigMaj(message) {
  console.debug("Callback siteConfigMaj %O", message)
  const estampilleRecue = message.estampille
  if(estampilleRecue > _estampilleCourante) {
    console.debug("Trigger renouvellement configuration")
    _resolverWorker.rechargerConfiguration()
  }
}

function sectionMaj(message) {
  console.debug("Callback sectionMaj %O", message)
  _majSection(message)
}

function setEtatConnexion(etat) {
  console.debug("Callback setEtatConnexion %O", etat)
}
