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

    this.webSocketHandler.enregistrerCallback('messageMq', this.messageMq);
    this.webSocketHandler.enregistrerCallback('documents', this.documentsMq);
  }

  componentWillUnmount() {
    this.webSocketHandler.deconnecter();
  }

  setDocuments(event) {
    console.debug("Documents recus");
    console.debug(event);
    this.setState(event);
  }

  messageMq(message) {
    console.debug("Message MQ recu dans SenseursPassifs:");
    console.debug(message);
  }

  documentsMq(message) {
    console.debug("Documents MQ");
    console.debug(message);
  }

  render() {
    return (
      <div>Vitrine sur SenseursPassifs</div>
    );
  }

}
