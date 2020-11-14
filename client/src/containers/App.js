import React from 'react'
import './App.css'
import {Jumbotron, Row, Col} from 'react-bootstrap'
import openSocket from 'socket.io-client'
import axios from 'axios'
// import {WebSocketApp} from '../components/webSocketApp'

import '../components/i18n'

import { SiteAccueil } from './Site'
import { LayoutMillegrilles } from './Layout'

const MG_SOCKETIO_URL = '/vitrine/socket.io'

export default class App extends React.Component {

  state = {
    nomDomaine: '',
    siteConfiguration: '',
    language: 'fr',

    page: '',

    manifest: {
      version: 'DUMMY',
      date: 'DUMMY'
    }

  }

  componentDidMount() {
    const nomDomaine = window.location.href.split('/')[2].split(':')[0]
    console.debug("Nom domaine serveur : %s", nomDomaine)
    this.setState({nomDomaine}, async _ =>{
      const siteConfiguration = await chargerSite(nomDomaine, this.state.language)
      this.setState({siteConfiguration})
    })
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
    }
  }

  deconnexionSocketIo = () => {
    console.debug("Deconnexion Socket.IO")
  }

  render() {
    var BaseLayout = LayoutAccueil

    const rootProps = {
      ...this.state,
    }

    var affichage = <p>Connexion en cours</p>
    if(this.state.page) {
      // BaseLayout = LayoutAccueil
    } else if(this.state.siteConfiguration) {
      affichage = <SiteAccueil rootProps={rootProps} />
    }

    return (
      <>
        <BaseLayout
          changerPage={this.changerPage}
          affichage={affichage}
          goHome={this.goHome}
          rootProps={rootProps} />
      </>
    )
  }
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

function _setTitre(titre) {
  document.title = titre
}

async function chargerSite(domaineUrl, language) {
  const url = '/vitrine/sites/' + domaineUrl + '/index.json'
  const reponse = await axios({method: 'get', url})
  console.debug("Reponse site : %O", reponse)

  const siteConfiguration = reponse.data

  if(language) {
    document.title = siteConfiguration.titre[language]
  }

  return siteConfiguration
}
