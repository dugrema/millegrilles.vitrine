import React from 'react';
import {VitrineWebSocketHandler} from '../websocket';

const nomDomaine = 'senseursPassifs';

export class SenseursPassifsVitrine extends React.Component {

  state = {
    senseurs: null,
    noeuds: null,
  }

  componentDidMount() {
    this.webSocketHandler = new VitrineWebSocketHandler(nomDomaine, this.messageMq);
    this.webSocketHandler.connecter();

    // this.props.webSocketHandler.chargerDomaine(nomDomaine, reponse=>this.setDocuments(reponse));

    this.webSocketHandler.enregistrerCallback('mq_message', this.messageMq);
    this.webSocketHandler.enregistrerCallback('documents', this.documentsMq);
  }

  componentWillUnmount() {
    this.webSocketHandler.deconnecter();
  }

  setDocuments(event) {
    // console.debug("Documents recus");
    // console.debug(event);
    this.setState(event);
  }

  messageMq = message => {
    console.debug("Message MQ recu dans SenseursPassifs:");
    console.debug(message);
  }

  documentsMq = message => {
    console.debug("Documents MQ");
    // console.debug(message);
    this.setState({senseurs: message.senseurs, noeuds: message.noeuds});
  }

  render() {
    return (
      <div>
        <div>Vitrine sur SenseursPassifs</div>

        <AfficherListeNoeuds
          noeuds={this.state.noeuds}
          />
      </div>
    );
  }

}

class AfficherListeNoeuds extends React.Component {

  afficherNoeud(noeud) {

    let listeSenseurs = [];
    for(let noSenseur in noeud.dict_senseurs) {
      let senseur = noeud.dict_senseurs[noSenseur];
      // console.debug(senseur);
      listeSenseurs.push(
        <div key={senseur.senseur + '@' + noeud.noeud}>
          {senseur.senseur}:
          {senseur.location}
          {senseur.temperature}
          {senseur.humidite}
          {senseur.pression}
          {senseur.millivolt}
        </div>
      );
    }

    return (
      <div key={noeud.noeud}>
        {listeSenseurs}
      </div>
    );

  }

  render() {
    let noeudsRender = [];
    for(let noeudNom in this.props.noeuds) {
      // console.debug("Noeud: " + noeudNom);
      let noeud = this.props.noeuds[noeudNom];
      let contenuNoeud = this.afficherNoeud(noeud);
      noeudsRender.push(contenuNoeud);
    }

    return (
      <div>{noeudsRender}</div>
    );
  }

}
