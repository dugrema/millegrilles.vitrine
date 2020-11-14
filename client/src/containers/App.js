import React from 'react'
import './App.css'
import {Jumbotron, Row, Col} from 'react-bootstrap'
import openSocket from 'socket.io-client'
import axios from 'axios'
// import {WebSocketApp} from '../components/webSocketApp'

import '../components/i18n'

import { LayoutMillegrilles } from './Layout'

const MG_SOCKETIO_URL = '/vitrine/socket.io'

export default class App extends React.Component {

  state = {
    nomDomaine: '',
    manifest: {
      version: 'DUMMY',
      date: 'DUMMY'
    }
  }

  componentDidMount() {
    const nomDomaine = window.location.href.split('/')[2].split(':')[0]
    console.debug("Nom domaine serveur : %s", nomDomaine)
    this.setState({nomDomaine})
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

    // let affichage = (
    //   <Applications
    //     page={this.state.page}
    //     rootProps={rootProps} />
    // )

    const affichage = <p>Connexion en cours</p>

    return (
      <>
        <BaseLayout
          changerPage={this.changerPage}
          affichage={affichage}
          goHome={this.goHome}
          rootProps={{
            ...rootProps,
            toggleProtege: this.toggleProtege,
          }} />
      </>
    )
  }
}

// Layout general de l'application
function LayoutAccueil(props) {

  const pageAffichee = (
    <div>

      <Jumbotron>
        <h1>{props.rootProps.titreMillegrille}</h1>
        <Row>
          <Col sm={10}>
            <p className='idmg'>{props.rootProps.idmgCompte}</p>
            <p>{props.rootProps.nomUsager}</p>
          </Col>
          <Col sm={2} className="footer-right">QR Code</Col>
        </Row>
      </Jumbotron>

      {props.affichage}

    </div>
  )

  return (
    <LayoutMillegrilles
      changerPage={props.changerPage}
      page={pageAffichee}
      goHome={props.goHome}
      sousMenuApplication={props.sousMenuApplication}
      rootProps={props.rootProps} />
  )
}

// function _setTitre(titre) {
//   document.title = titre
// }
