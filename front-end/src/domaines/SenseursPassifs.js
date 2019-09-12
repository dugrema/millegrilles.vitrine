import React from 'react';

const nomDomaine = 'senseursPassifs';

export class SenseursPassifsVitrine extends React.Component {

  state = {
    senseurs: null,
    noeuds: null,
  }

  componentDidMount() {
    this.props.webSocketHandler.chargerDomaine(nomDomaine, reponse=>this.setDocuments(reponse));
  }

  componentWillUnmount() {
  }

  setDocuments(event) {
    console.debug("Documents recus");
    console.debug(event);
    this.setState(event);
  }

  messageMq(event) {
    console.debug("Message MQ recu dans SenseursPassifs:");
    console.debug(event);
  }

  render() {
    return (
      <div>Vitrine sur SenseursPassifs</div>
    );
  }

}
