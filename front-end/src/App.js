import React, {PureComponent} from 'react';
import './w3.css';  // Copie de https://www.w3schools.com/w3css/4/w3.css
import './App.css';
import 'font-awesome/css/font-awesome.min.css';

import {SenseursPassifsVitrine} from './domaines/SenseursPassifs';

class App extends React.Component {

  state = {
    domaine: null,
  }

  webSocketHandler = null;

  domaines = {
    SenseursPassifs: SenseursPassifsVitrine
  }

  menuActions = {
    afficherAccueil: event => {
      this.setState({domaine: null});
    },
    changerDomaine: event => {
      this.setState({domaine: event.currentTarget.value});
    }
  }

  componentDidMount() {
  }

  header() {
    return (
      <header className="App-header w3-container w3-red w3-center">
        <p className="w3-xlarge">MilleGrille XXXX</p>
      </header>
    );
  }

  contenuPageAccueil() {
    return (
      <div class="w3-row-padding w3-padding-64 w3-container">
        <div class="w3-content">
          <div class="w3-twothird">
            <h1>Vitrine</h1>
            <p class="w3-text-grey">Choisir un domaine pour continuer.</p>
          </div>

          <div class="w3-third w3-center">
            <i class="fa fa-anchor w3-padding-64 w3-text-red"></i>
          </div>
        </div>
      </div>
    );
  }

  render() {

    let content;
    if(this.state.domaine) {
      const DomaineElement = this.domaines[this.state.domaine];
      content = (
        <DomaineElement />
      );
    } else {
      content = this.contenuPageAccueil();
    }

    let header = this.header();
    return (
        <div className="App">
          <ToggleMenu
            menuActions={this.menuActions}/>
          {header}
          {content}
        </div>
    );
  }

}

class ToggleMenu extends PureComponent {

  state = {
    show: false,
  }

  toggleMenu = event => {
    this.setState({show: !this.state.show});
  }

  afficherAccueil = event => {
    this.setState({show: false});
    this.props.menuActions.afficherAccueil(event);
  }

  changerDomaine = event => {
    this.setState({show: false});
    this.props.menuActions.changerDomaine(event);
  }

  render() {
    let mobileMenu;
    if(this.state.show) {
      mobileMenu = (
        <div id="navDemo" class="w3-bar-block w3-white w3-hide w3-hide-large w3-hide-medium w3-large w3-show">
          <button className="w3-bar-item w3-button w3-padding-large"
            onClick={this.afficherAccueil} value="">Accueil</button>
          <button className="w3-bar-item w3-button w3-padding-large"
            onClick={this.changerDomaine} value="SenseursPassifs">Senseurs Passifs</button>
        </div>
      );
    } else {
      mobileMenu = null;
    }

    let content = (
      <nav class="w3-top">
        <div class="w3-bar w3-red w3-card w3-left-align w3-large">
          <button
            class="w3-bar-item w3-button w3-hide-medium w3-hide-large w3-right w3-padding-large w3-hover-white w3-large w3-red"
            onClick={this.toggleMenu}
            title="Toggle Navigation Menu">
              <i class="fa fa-bars"></i>
          </button>
          <button
            className="w3-bar-item w3-button w3-padding-large w3-white"
            onClick={this.afficherAccueil} value="">Accueil</button>
          <button
            className="w3-bar-item w3-button w3-hide-small w3-padding-large w3-hover-white"
            onClick={this.changerDomaine}
            value="SenseursPassifs">Senseurs Passifs</button>
        </div>

        {mobileMenu}
      </nav>
    );

    return content;
  }
}

export default App;
