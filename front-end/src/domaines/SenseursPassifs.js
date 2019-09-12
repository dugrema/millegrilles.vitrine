import React from 'react';

const routingKeys = [
  'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel',
  'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel',
];

export class SenseursPassifsVitrine extends React.Component {

  state = {

  }

  componentDidMount() {
    this.props.webSocketHandler.subscribe(routingKeys);
  }

  componentWillUnmount() {
    this.props.webSocketHandler.unsubscribe(routingKeys);
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
