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

    if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel') {
      let noeud = message.message;
      let noeuds = {...this.state.noeuds};
      noeuds[noeud.noeud] = noeud;
      this.setState({noeuds: noeuds});
    } else if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel') {
      let senseur = message.message;
      let senseurs = {...this.state.senseurs};
      senseurs[senseur.senseur+'@'+senseur.noeud] = senseur;
      this.setState({senseurs: senseurs});
    }
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
        <tr key={senseur.senseur + '@' + noeud.noeud}>
          <td>{senseur.location}</td>
          <td>{senseur.temperature}&deg;C</td>
          <td>{senseur.humidite}%</td>
          <td>{senseur.pression} kPa</td>
          <td>{senseur.millivolt} mV</td>
        </tr>
      );
    }

    return (
      <div key={noeud.noeud}>
        <div>
          <h2>Noeud {noeud.noeud}</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Temperature</th>
              <th>Humidite</th>
              <th>Pression</th>
              <th>Millivolt</th>
            </tr>
          </thead>
          <tbody>
            {listeSenseurs}
          </tbody>
        </table>
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