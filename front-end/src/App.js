import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Nav, Navbar, NavDropdown, Container, Row, Col} from 'react-bootstrap';
import axios from 'axios';

// Importer sections et domaines
import { AfficherSection } from './sections/mapSections';

import './i18n';
import { Trans, Translation, withTranslation } from 'react-i18next';
import { traduire } from './langutils.js';

import './App.css';

const MILLEGRILLE_LIBELLE = 'millegrille.configuration', MILLEGRILLE_URL = '/millegrille.json';
const NOEUDPUBLIC_LIBELLE = 'noeudPublic.configuration', NOEUDPUBLIC_URL = '/noeudPublic.json';
const USER_LOCALE = 'user.locale';

class _app extends React.Component {

  state = {
    configuration: null,
    noeudPublic: null,
  }

  webSocketHandler = null;

  componentDidMount() {
    // Charger la configuration de la MilleGrille
    this._chargerConfiguration();
  }

  componentDidUpdate() {
    const i18n = this.props.i18n;
    const language = i18n.language;
    _setTitre(language, this._milleGrille());
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

    const configurationNoeud = this._configuration(),
          configurationMilleGrille = this._milleGrille();

    const parametresCommuns = {
      millegrille: configurationMilleGrille,
      configuration: configurationNoeud,
      language
    };

    return (
      <Router>
        <div className="App">
          <ToggleMenu
            millegrille={configurationMilleGrille}
            configuration={configurationNoeud}
            language={language}
            languageChangement={languageChangement}
            changeLanguage={changeLanguage}
            menuActions={this.menuActions}
            section={this.state.section}
            />

          <AfficherSection
            millegrille={configurationMilleGrille}
            configuration={configurationNoeud}
            language={language} />

          <Footer {...parametresCommuns} />
        </div>
      </Router>
    );
  }

  _chargerConfiguration() {
    this._chargerFichierConfiguration(MILLEGRILLE_URL, MILLEGRILLE_LIBELLE);
    this._chargerFichierConfiguration(NOEUDPUBLIC_URL, NOEUDPUBLIC_LIBELLE);
  }

  _chargerFichierConfiguration(url, libelle) {
    const headers = {};
    let contenuStr = localStorage.getItem(libelle);
    if(contenuStr) {
      const configuration = JSON.parse(contenuStr);
      let maj = {};
      maj[libelle] = configuration.contenu;
      this.setState(maj);

      let lastModified = configuration.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    axios.get('/defauts' + url, {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      // console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder la configuration
        const contenuPage = resp.data;
        const maj = {};
        maj[libelle] = contenuPage;
        this.setState(maj);

        const contenuJson = {
          contenu: contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        localStorage.setItem(libelle, JSON.stringify(contenuJson));
      }
    })
    .catch(err=>{
      console.error("Erreur acces config defaut " + url);
      console.error(err);
    })
  }

  _milleGrille() {
    if(this.state[MILLEGRILLE_LIBELLE])
      return this.state[MILLEGRILLE_LIBELLE];
  }

  _configuration() {
    if(this.state[NOEUDPUBLIC_LIBELLE])
      return this.state[NOEUDPUBLIC_LIBELLE];
  }

}

const App = withTranslation()(_app);

class ToggleMenu extends React.Component {

  render() {
    var configuration, configurationMilleGrille;

    // Preparer le menu a partir de millegrilles.json
    const menuElements = [];
    if(this.props.configuration && this.props.configuration.menu) {

      for(let idx in this.props.configuration.menu) {
        let menuItem = this.props.configuration.menu[idx];
        if(typeof menuItem === 'string') {
          menuElements.push(
            <Nav.Link key={menuItem} href={'/' + menuItem}>
              <Trans>{'menu.' + menuItem}</Trans>
            </Nav.Link>
          )
        } else if(menuItem.menu) {
          // C'est un sous-menu
          let sousMenus = [];
          for(let idxSousMenu in menuItem.menu) {
            let sousMenu = menuItem.menu[idxSousMenu];
            sousMenus.push(
              <NavDropdown.Item key={sousMenu} href={'/' + sousMenu}>
                <Trans>{'menu.' + sousMenu}</Trans>
              </NavDropdown.Item>
            );
          }

          menuElements.push(
            <Translation key={menuItem.type}>
              {
                t =>
                <NavDropdown title={t('menu.' + menuItem.type)} id="collasible-nav-sections">
                  {sousMenus}
                </NavDropdown>
              }
            </Translation>
          );
        }
      }
    }

    var nomMilleGrille = (<Trans>application.nom</Trans>);
    if(this.props.millegrille && this.props.millegrille.descriptif) {
      nomMilleGrille = traduire(this.props.millegrille, 'descriptif', this.props.language);
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="danger" variant="dark" fixed="top">
        <Navbar.Brand href='/'>{nomMilleGrille}</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-menu" />
        <Navbar.Collapse id="responsive-navbar-menu">
          <Nav className="mr-auto" activeKey={this.props.section}>
            {menuElements}
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

class Footer extends React.Component {

  render() {
    var idmg, millegrille, courriel, twitter, contact = [];
    if(this.props.millegrille) {
      courriel = this.props.millegrille.courriel;
      twitter = this.props.millegrille.twitter;
      idmg = this.props.millegrille.idmg;
      millegrille = this.props.millegrille.millegrille;
    }

    if(courriel) {
      contact.push(
        <Row key="courriel">
          <Trans>application.courriel</Trans> {courriel}
        </Row>
      )
    }
    if(twitter) {
      contact.push(
        <Row key="twitter">
          <Trans>application.twitter</Trans> {twitter}
        </Row>
      )
    }
    if(millegrille) {
      contact.push(
        <Row key="millegrille">
          <Trans>application.millegrilles</Trans>
          <span className="millegrille">{millegrille}</span>
        </Row>
      )
    }
    if(idmg) {
      contact.push(
        <Row key="idmg">
          <Trans>application.millegrille_idmg</Trans>
          <span className="idmg">{idmg}</span>
        </Row>
      )
    }

    return (
      <Container fluid className="footer bg-danger">
        <Row>
          <Col md={3}>
            <Row><h2>Col 1</h2></Row>
          </Col>
          <Col md={3}>
            <Row><h2>Col 2</h2></Row>
          </Col>
          <Col md={6}>
            <Row><h2>Contact</h2></Row>
            {contact}
          </Col>
        </Row>
        <Row className="millegrille-footer">
          <Col>
            <Trans>application.vitrineAdvert</Trans>
          </Col>
        </Row>
      </Container>
    );
  }

}

function _setTitre(language, configuration) {
  const vitrineDescription = (<Translation>{t=>t('application.nom')}</Translation>);
  if(configuration) {
    document.title = traduire(configuration, 'descriptif', language) || vitrineDescription;
  } else {
    document.title = vitrineDescription;
  }
}

export default App;
