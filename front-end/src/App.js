import React from 'react';
import axios from 'axios';
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import {AccueilVitrine} from './sections/accueil';
import './App.css';

import {SenseursPassifsVitrine} from './domaines/SenseursPassifs';

const MILLEGRILLE_LIBELLE = 'millegrille.configuration', MILLEGRILLE_URL = '/millegrille.json';

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
    let contenuStr = localStorage.getItem(MILLEGRILLE_LIBELLE);

    const headers = {};
    if(contenuStr) {
      const configuration = JSON.parse(contenuStr);
      this.setState({configuration});
      _setTitre(configuration);

      let lastModified = configuration.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    axios.get('/defauts' + MILLEGRILLE_URL, {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder la configuration
        const contenuPage = resp.data;
        const configuration = {
          contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        this.setState({configuration});
        localStorage.setItem(MILLEGRILLE_LIBELLE, JSON.stringify(configuration));

        // Mettre a jour le titre de Vitrine
        _setTitre(this.state.configuration);
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
            <Nav.Link eventKey="Albums">Albums</Nav.Link>
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

function _setTitre(configuration) {
  if(configuration) {
    document.title = configuration.contenuPage.descriptif || 'Vitrine';
  } else {
    document.title = 'Vitrine';
  }
}

export default App;
