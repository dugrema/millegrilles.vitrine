import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import {AccueilVitrine} from './accueil/accueil';
import './App.css';

import {SenseursPassifsVitrine} from './domaines/SenseursPassifs';

const CONFIGURATION_MILLEGRILLE = 'configuration.millegrille';
const CONFIGURATION_MILLEGRILLE_LASTMODIFIED = 'configuration.millegrille.lastModified';

class App extends React.Component {

  state = {
    domaine: '',
    configuration: null,
  }

  webSocketHandler = null;

  domaines = {
    SenseursPassifs: SenseursPassifsVitrine,
  }

  menuActions = {
    afficherAccueil: event => {
      this.setState({domaine: null});
    },
    changerDomaine: domaine => {
      this.setState({domaine: domaine});
    }
  }

  componentDidMount() {
    // Charger la configuration de la MilleGrille
    this._chargerConfiguration();
  }

  render() {

    let content;
    if(this.state.domaine && this.state.domaine !== '') {
      const DomaineElement = this.domaines[this.state.domaine];
      content = (<DomaineElement key="domaine" />);
    } else {
      content = (
        <AccueilVitrine
          configuration={this.state.configuration} />
      );
    }

    return (
        <div className="App">
          <ToggleMenu
            menuActions={this.menuActions}
            domaine={this.state.domaine} />
          {content}
        </div>
    );
  }

  _chargerConfiguration() {
    let config = localStorage.getItem(CONFIGURATION_MILLEGRILLE);
    if(config) {
      const configJson = JSON.parse(config);
      this.setState({configuration: configJson});
      ReactDOM.render(
        <Titre configuration={configJson}/>,
        document.getElementById('titre')
      );
    }

    let lastModified = localStorage.getItem(CONFIGURATION_MILLEGRILLE_LASTMODIFIED);
    const headers = {};
    if(lastModified) {
      headers['If-Modified-Since'] = lastModified;
    }

    axios.get('/defauts/millegrille.json', {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder la configuration
        const configuration = resp.data;
        this.setState({configuration});
        localStorage.setItem(CONFIGURATION_MILLEGRILLE, JSON.stringify(configuration));
        localStorage.setItem(CONFIGURATION_MILLEGRILLE_LASTMODIFIED, resp.headers['last-modified']);

        // Mettre a jour le titre de Vitrine
        ReactDOM.render(
          <Titre configuration={this.state.configuration}/>,
          document.getElementById('titre')
        );
      }
    })
    .catch(err=>{
      console.error("Erreur acces config defaut /defauts/millegrille.json");
      console.error(err);
    })
  }

}

class ToggleMenu extends React.Component {

  state = {
  }

  changerDomaine = event => {
    this.setState({show: false});
    let domaine;
    if(event.currentTarget) {
      domaine = event.currentTarget.value;
    } else {
      domaine = event;
    }
    this.props.menuActions.changerDomaine(domaine);
  }

  render() {
    let items = {'SenseursPassifs': 'Senseurs Passifs'};
    let liensDomaines = [];
    for(var domaine in items) {
      let domaineDesc = items[domaine];
      liensDomaines.push(
        <NavDropdown.Item key={domaine} eventKey={domaine}>{domaineDesc}</NavDropdown.Item>
      );
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="danger" variant="dark" fixed="top"
              onSelect={this.changerDomaine}>
        <Navbar.Brand href='#' onClick={this.changerDomaine}>Vitrine</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-menu" />
        <Navbar.Collapse id="responsive-navbar-menu">
          <Nav className="mr-auto" activeKey={this.props.domaine}>
            <Nav.Link eventKey="Album">Album</Nav.Link>
            <Nav.Link eventKey="Documents">Documents</Nav.Link>
            <Nav.Link eventKey="Fichiers">Fichiers</Nav.Link>
            <NavDropdown title="Par domaine" id="collasible-nav-domaines">
              {liensDomaines}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );

    return content;
  }
}

function Titre(props) {
  if(props.configuration) {
    return props.configuration.descriptif || 'Vitrine';
  } else {
    return 'Vitrine';
  }
}

export default App;
