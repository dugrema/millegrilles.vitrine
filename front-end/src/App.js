import React from 'react';
import logo from './logo.svg';
import './App.css';

import {SenseursPassifsVitrine} from './domaines/SenseursPassifs';
import {VitrineWebSocketHandler} from './websocket.js';

class App extends React.Component {

  state = {
    domaine: null,
  }

  webSocketHandler = null;

  domaines = {
    SenseursPassifs: SenseursPassifsVitrine
  }

  afficherAccueil = event => {
    this.setState({domaine: null});
  }

  changerDomaine = event => {
    this.setState({domaine: event.currentTarget.value});
  }

  componentDidMount() {
    this.webSocketHandler = new VitrineWebSocketHandler();
    this.webSocketHandler.connecter();
  }

  render() {

    let content;
    if(this.state.domaine) {
      const DomaineElement = this.domaines[this.state.domaine];
      content = (<DomaineElement />);
    } else {
      content = (
        <p>Choisir un domaine</p>
      );
    }

    let nav = (
      <nav>
        <div>
          <div>
            <button className="aslink" onClick={this.afficherAccueil} value="">Accueil</button>
            <button className="aslink" onClick={this.changerDomaine} value="SenseursPassifs">Senseurs Passifs</button>
          </div>
        </div>
      </nav>
    )

    return (
      <div className="App">
        <h1>Vitrine sur la MilleGrille XXXX</h1>
        {nav}
        {content}
      </div>
    );
  }

}

export default App;
