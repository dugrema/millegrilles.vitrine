import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import axios from 'axios';

// Importer sections et domaines
import { AccueilVitrine } from './sections/accueil';
import { AlbumsVitrine } from './sections/albums';
import { DocumentsVitrine } from './sections/documents';
import { FichiersVitrine } from './sections/fichiers';
import {listerDomaines} from './domaines/domainesSupportes';

import './i18n';
import { Trans, Translation, withTranslation } from 'react-i18next';
import { traduire } from './langutils.js';

import './App.css';

const MILLEGRILLE_LIBELLE = 'millegrille.configuration', MILLEGRILLE_URL = '/millegrille.json';
const USER_LOCALE = 'user.locale';

class _app extends React.Component {

  state = {
    configuration: null,
  }

  webSocketHandler = null;

  componentDidMount() {
    // Charger la configuration de la MilleGrille
    this._chargerConfiguration();
  }

  componentDidUpdate() {
    localStorage.setItem('locale', this.state.locale);
    _setTitre(this.localeProps, this.state.configuration);
  }

  render() {

    // Ajouter fonctionnalite pour changer de langage
    const i18n = this.props.i18n;
    const changeLanguage = lng => {
      console.debug("Changer langage vers " + lng);
      i18n.changeLanguage(lng);
    };
    const language = i18n.language;
    const languageChangement = language==='fr'?'en':'fr';

    return (
      <Router>
        <div className="App">
          <ToggleMenu
            configuration={this.state.configuration}
            language={language}
            languageChangement={languageChangement}
            changeLanguage={changeLanguage}
            menuActions={this.menuActions}
            section={this.state.section}
            />

          <Switch>
            <Route exact path="/">
              <AccueilVitrine
                language={language}
                configuration={this.state.configuration}
                />
            </Route>
            <Route path="/albums">
              <AlbumsVitrine
                language={language}
                configuration={this.state.configuration}
                />
            </Route>
            <Route path="/documents">
              <DocumentsVitrine
                language={language}
                configuration={this.state.configuration}
                />
            </Route>
            <Route path="/fichiers">
              <FichiersVitrine
                language={language}
                configuration={this.state.configuration}
                />
            </Route>
            <Route render={() => <h1><Trans>application.pageNonTrouvee</Trans></h1>} />
          </Switch>
        </div>
      </Router>
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
      // console.debug(resp);
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

const App = withTranslation()(_app);

class ToggleMenu extends React.Component {

  // state = {
  // }
  //
  // changerSection = event => {
  //   // Changement de lange n'est pas un changement de section
  //   if(event === 'fr' || event === 'en') return;
  //
  //   let section;
  //   if(event.currentTarget) {
  //     section = event.currentTarget.value;
  //   } else {
  //     section = event;
  //   }
  //   this.props.menuActions.changerSection(section);
  // }

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

    var nomMilleGrille = (<Trans>application.nom</Trans>);
    if(this.props.configuration && this.props.configuration.contenuPage.descriptif) {
      nomMilleGrille = traduire(this.props.configuration.contenuPage, 'descriptif', this.props.language);
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="danger" variant="dark" fixed="top">
        <Navbar.Brand href='/'>{nomMilleGrille}</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-menu" />
        <Navbar.Collapse id="responsive-navbar-menu">
          <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.changerSection}>
            <Nav.Link href="/albums"><Trans>menu.albums</Trans></Nav.Link>
            <Nav.Link href="/documents"><Trans>menu.documents</Trans></Nav.Link>
            <Nav.Link href="/fichiers"><Trans>menu.fichiers</Trans></Nav.Link>
            <Translation>
              {
                t =>
                <NavDropdown title={t('menu.domaines')} id="collasible-nav-domaines">
                  {liensDomaines}
                </NavDropdown>
              }
            </Translation>
          </Nav>
          <Nav className="justify-content-end">
            <Nav.Link eventKey={this.props.languageChangement} onSelect={this.props.changeLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );

    return content;
  }
}

// const ToggleMenu = withTranslation()(_toggleMenu);

function _setTitre(localeProps, configuration) {
  const vitrineDescription = (<Translation>{t=>t('application.nom')}</Translation>);
  if(configuration) {
    document.title = configuration.contenuPage.descriptif || vitrineDescription;
  } else {
    document.title = vitrineDescription;
  }
}

export default App;
