import React from 'react';
import axios from 'axios';
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import {AccueilVitrine} from './sections/accueil';

// Importer sections et domaines
import {AlbumsVitrine} from './sections/albums';
import {DocumentsVitrine} from './sections/documents';
import {FichiersVitrine} from './sections/fichiers';
import {getDomaine, listerDomaines} from './domaines/domainesSupportes';

import './i18n';
import { Trans, Translation } from 'react-i18next';

import './App.css';

const MILLEGRILLE_LIBELLE = 'millegrille.configuration', MILLEGRILLE_URL = '/millegrille.json';
const USER_LOCALE = 'user.locale';

// Mapping des sections principales de Vitrine
const sections = {
  Albums: AlbumsVitrine,
  Documents: DocumentsVitrine,
  Fichiers: FichiersVitrine,
}

class App extends React.Component {

  state = {
    section: '',
    configuration: null,
    locale: 'fr',
  }

  webSocketHandler = null;

  menuActions = {
    afficherAccueil: event => {
      this.setState({domaine: null});
    },
    changerSection: page => {
      this.setState({
        section: page,
      });
    }
  }

  componentDidMount() {
    // Charger la configuration de la MilleGrille
    this._chargerConfiguration();
  }

  componentDidUpdate() {
    localStorage.setItem('locale', this.state.locale);
    _setTitre(this.localeProps, this.state.configuration);
  }

  render() {

    let SectionElement;
    if(this.state.section && this.state.section !== '') {
      if(sections[this.state.section]) {
        SectionElement = sections[this.state.section];
      } else {
        // const DomaineElement = this.domaines[this.state.domaine];
        SectionElement = getDomaine(this.state.domaine);
      }
    } else {
      SectionElement = AccueilVitrine;
    }
    let content = (
      <SectionElement locale={this.state.locale} configuration={this.state.configuration}/>
    );

    return (
      <div className="App">
        <ToggleMenu
          locale={this.state.locale}
          localeProps={this.localeProps}
          menuActions={this.menuActions}
          section={this.state.section} />
        {content}
      </div>
    );
  }

  _chargerConfiguration() {
    const valeursInitiales = {};

    // Verifier si l'usager a deja la langue dans sa configuration
    let locale = localStorage.getItem(USER_LOCALE);
    if(locale) {
      valeursInitiales.locale = locale;
    }

    const headers = {};
    let contenuStr = localStorage.getItem(MILLEGRILLE_LIBELLE);
    if(contenuStr) {
      const configuration = JSON.parse(contenuStr);
      valeursInitiales.configuration = configuration;
      this.setState(valeursInitiales);
      _setTitre(this.localeProps, configuration);

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

        if(!locale) {
          locale = contenuPage['default.locale'];
        }

        this.setState({configuration, locale});
        localStorage.setItem(MILLEGRILLE_LIBELLE, JSON.stringify(configuration));
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

  changerSection = event => {
    let section;
    if(event.currentTarget) {
      section = event.currentTarget.value;
    } else {
      section = event;
    }
    this.props.menuActions.changerSection(section);
  }

  render() {
    let items = listerDomaines();
    let liensDomaines = [];
    for(var idx in items) {
      let domaine = items[idx];
      liensDomaines.push(
        <NavDropdown.Item key={domaine} eventKey={domaine}>
          <Trans>{'domaines.' + domaine}</Trans>
        </NavDropdown.Item>
      );
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="danger" variant="dark" fixed="top"
              onSelect={this.changerSection}>
        <Navbar.Brand href='#' onClick={this.changerSection}>Vitrine</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-menu" />
        <Navbar.Collapse id="responsive-navbar-menu">
          <Nav className="mr-auto" activeKey={this.props.section}>
            <Nav.Link eventKey="Albums"><Trans>menu.albums</Trans></Nav.Link>
            <Nav.Link eventKey="Documents"><Trans>menu.documents</Trans></Nav.Link>
            <Nav.Link eventKey="Fichiers"><Trans>menu.fichiers</Trans></Nav.Link>
            <Translation>
              {
                t =>
                <NavDropdown title={t('menu.domaines')} id="collasible-nav-domaines">
                  {liensDomaines}
                </NavDropdown>
              }
            </Translation>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );

    return content;
  }
}

function _setTitre(localeProps, configuration) {
  const vitrineDescription = (<Translation>{t=>t('application.nom')}</Translation>);
  if(configuration) {
    document.title = configuration.contenuPage.descriptif || vitrineDescription;
  } else {
    document.title = vitrineDescription;
  }
}

export default App;
