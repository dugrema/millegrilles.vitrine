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
    manifest: {
      version: 'DUMMY',
      date: 'DUMMY'
    }
  }

  componentDidMount() {
    const nomDomaine = window.location.href.split('/')[2]
    console.debug("Nom domaine serveur : %s", nomDomaine)
  }

  connecterSocketIo = () => {
    if( ! this.state.connexionSocketIo ) {
      // console.debug("Connecter socket.io sur %s", MG_SOCKETIO_URL)
      const socket = openSocket('/', {
        path: MG_SOCKETIO_URL,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      })

      socket.on('disconnect', () => {this.deconnexionSocketIo()})
      socket.on('modeProtege', reponse => {this.setEtatProtege(reponse)})

      // Ajouter wrapper pour l'application (dao)
      // const webSocketApp = new WebSocketApp(socket)
      //
      // this.setState({connexionSocketIo: socket}, ()=>{
      //   socket.emit('getInfoIdmg', {}, reponse=>{
      //     // console.debug("Info idmg compte")
      //     // console.debug(reponse)
      //     this.setState({...reponse, webSocketApp})
      //   })
      // })
    }
  }

  deconnexionSocketIo = () => {
    // console.debug("Deconnexion Socket.IO")
    this.setState({modeProtege: false})
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

    const affichage = <p>Allo</p>

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

// // Layout general de l'application
// function LayoutApplication(props) {
//
//   const pageAffichee = props.affichage
//
//   return (
//     <LayoutMillegrilles
//       changerPage={props.changerPage}
//       page={pageAffichee}
//       goHome={props.goHome}
//       sousMenuApplication={props.sousMenuApplication}
//       rootProps={props.rootProps} />
//   )
// }

// function _setTitre(titre) {
//   document.title = titre
// }
