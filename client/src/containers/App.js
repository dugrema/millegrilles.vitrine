import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Nav, Navbar, NavDropdown, Container, Row, Col} from 'react-bootstrap';
import axios from 'axios';
import { ConnexionWebsocket } from './Authentification'
import { Layout } from './Layout'

// Importer sections et domaines
import AfficherSection from './mapSections'
import { SectionVitrine } from './sections'

import '../components/i18n';
import { Trans, Translation, withTranslation } from 'react-i18next';
import { traduire } from '../components/langutils.js';

import './App.css';

const MILLEGRILLE_LIBELLE = 'millegrille.configuration', MILLEGRILLE_URL = 'millegrille.json';
const NOEUDPUBLIC_LIBELLE = 'noeudPublic.configuration', NOEUDPUBLIC_URL = 'noeudPublic.json';

// Application withTranslation sur l'application
export default class _ApplicationVitrine extends SectionVitrine {

  NOM_SECTION = 'global'

  CONFIG_DOCUMENTS = {
    'fichePublique': {pathFichier: '/global/fichePublique.json'},
    'configuration': {pathFichier: '/global/configuration.json'},
    'profilMillegrille': {pathFichier: '/global/profilMillegrille.json'},
  }

  // rootProps
  state = {
    configuration: null,
    noeudPublic: null,
    websocketApp: null,
    infoServeur: null,

    page: 'AccueilVitrine',

    manifest: {
      version: 'DUMMY',
      date: 'DUMMY'
    },

  }

  getConfigDocuments() {
    return this.CONFIG_DOCUMENTS
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  componentDidMount() {
    axios.get('/vitrine/info.json').then(async r => {
      await this.setInfoJson(r)
      console.debug("App.js componentDidMount")
      super.componentDidMount()  // Besoin IDMG
    }).catch(e=>this.erreurInfoJson(e))


    // // Charger la configuration de la MilleGrille
    // this._chargerConfiguration()
    //
    // // Enregistrer callback pour maj de la fiche publique
    // this.majConfigurationMilleGrille = this.majConfigurationMilleGrille.bind(this);
    // this.state.webSocketHandler.enregistrerCallback(MILLEGRILLE_LIBELLE, this.majConfigurationMilleGrille);
    //
    // // Enregistrer callback pour maj configuration du noeud public
    // this.majConfigurationNoeudPublic = this.majConfigurationNoeudPublic.bind(this);
    // this.state.webSocketHandler.enregistrerCallback(NOEUDPUBLIC_LIBELLE, this.majConfigurationNoeudPublic);
  }

  componentWillUnmount() {
    console.debug("Unmount de l'application")
    super.componentWillUnmount()
    if(this.state.websocketApp) {
      this.state.websocketApp.deconnecter()
    }
  }

  setInfoJson(response) {
    console.debug("Info serveur")
    console.debug(response)
    const infoServeur = response.data
    const idmg = infoServeur.idmg
    return new Promise((resolve, reject) => {
      this.setState({infoServeur, idmg}, ()=>resolve())
    })
  }

  erreurInfoJson(err) {
    console.error("Erreur chargement info.json")
    console.error(err)
  }

  majConfigurationMilleGrille(enveloppe, lastModified) {
    console.debug("MAJ Configuration MilleGrille");
    console.debug(enveloppe);

    const configuration = {};
    configuration[MILLEGRILLE_LIBELLE] = enveloppe.message;
    this.setState(configuration);
    const contenuJson = {
      contenu: enveloppe.message,
      lastModified: lastModified,
    }
    localStorage.setItem(MILLEGRILLE_LIBELLE, JSON.stringify(contenuJson));
  }

  majConfigurationNoeudPublic(enveloppe, lastModified) {
    console.debug("MAJ Configuration noeud public");
    console.debug(enveloppe);

    const configuration = {};
    configuration[NOEUDPUBLIC_LIBELLE] = enveloppe.message;
    this.setState(configuration);
    const contenuJson = {
      contenu: enveloppe.message,
      lastModified: lastModified,
    }
    localStorage.setItem(NOEUDPUBLIC_LIBELLE, JSON.stringify(contenuJson));
  }

  componentDidUpdate() {
    const i18n = this.props.i18n
    const language = 'fr' //i18n.language;
    // _setTitre(language, this._milleGrille());
  }

  setWebsocketApp = websocketApp => {
    // Set la connexion Socket.IO. Par defaut, le mode est prive (lecture seule)
    this.setState({websocketApp})
  }

  changerPage = page => {
    if(page === this.state.page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      this.setState({page: ''}, ()=>{this.setState({page})})
    } else {
      // console.debug("Page : %s", page)
      this.setState({page})
    }
  }

  render() {

    // Ajouter fonctionnalite pour changer de langage
    const i18n = this.props.i18n;
    const changeLanguage = lng => {
      // console.debug("Changer language vers " + lng);
      i18n.changeLanguage(lng);
    };
    const language = 'fr'; // i18n.language;
    // const language = i18n.language;
    const languageChangement = language==='fr'?'en':'fr';

    // const configurationNoeud = this._configuration(),
    //       configurationMilleGrille = this._milleGrille();

    // const parametresCommuns = {
    //   millegrille: configurationMilleGrille,
    //   configuration: configurationNoeud,
    //   language
    // };

    let page
    if( ! this.state.websocketApp ) {
      page = <ConnexionWebsocket setWebsocketApp={this.setWebsocketApp} />
    } else if( ! this.state.infoServeur ) {
      page = <p>Chargement information sur la millegrille</p>
    } else {
      page = <AfficherSection rootProps={{...this.state}} />
    }

    return (
      <Router>
        <div className="App">
          <Layout changerPage={this.changerPage} page={page} rootProps={{...this.state}} />
        </div>
      </Router>
    );
  }

  //   axios.get('/data/' + url, {
  //     headers,
  //     validateStatus: status=>{return status === 200 || status === 304}
  //   })
  //   .then(resp=>{
  //     // console.debug(resp);
  //     if(resp.status === 200) {
  //       // Sauvegarder la configuration
  //       const contenuPage = resp.data;
  //       const maj = {};
  //       maj[libelle] = contenuPage;
  //       this.setState(maj);
  //
  //       const contenuJson = {
  //         contenu: contenuPage,
  //         lastModified: resp.headers['last-modified'],
  //       }
  //       localStorage.setItem(libelle, JSON.stringify(contenuJson));
  //     }
  //   })
  //   .catch(err=>{
  //     console.error("Erreur acces config defaut " + url);
  //     console.error(err);
  //   })
  // }

  // _milleGrille() {
  //   if(this.state[MILLEGRILLE_LIBELLE])
  //     return this.state[MILLEGRILLE_LIBELLE];
  // }
  //
  // _configuration() {
  //   if(this.state[NOEUDPUBLIC_LIBELLE])
  //     return this.state[NOEUDPUBLIC_LIBELLE];
  // }

} const ApplicationVitrine = withTranslation()(_ApplicationVitrine)

class ToggleMenu extends React.Component {

  render() {
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
    if(this.props.millegrille && this.props.millegrille.nomMilleGrille) {
      nomMilleGrille = traduire(
        this.props.millegrille, 'nomMilleGrille', this.props.language,
        this.props.millegrille);
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
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
    var idmg, millegrille, courriel, twitter, facebook, facebookGroupe, contact = [];
    if(this.props.millegrille) {
      idmg = this.props.millegrille.idmg;

      if(this.props.millegrille.usager) {
        const usager = this.props.millegrille.usager;
        courriel = usager.courriel;
        twitter = usager.twitter;
        millegrille = usager.millegrille;
        facebook = usager.facebook;
        facebookGroupe = usager.facebookGroupe;
      }
    }

    if(courriel) {
      contact.push(
        <Row key="courriel">
          <Trans>application.courriel</Trans>
          <span className="valeur">
            <a href={'mailto:' + courriel}>
              {courriel}
            </a>
          </span>
        </Row>
      )
    }
    if(twitter) {
      contact.push(
        <Row key="twitter">
          <Trans>application.twitter</Trans>
          <span className="valeur">{twitter}</span>
        </Row>
      )
    }
    if(millegrille) {
      contact.push(
        <Row key="millegrille">
          <Trans>application.millegrilles</Trans>
          <span className="valeur">{millegrille}</span>
        </Row>
      )
    }
    if(facebook) {
      contact.push(
        <Row key="facebook">
          <Trans>application.facebook</Trans>
          <span className="valeur">
            <a href={facebook}>
              {facebook}
            </a>
          </span>
        </Row>
      )
    }
    if(facebookGroupe) {
      contact.push(
        <Row key="facebookGroupe">
          <Trans>application.facebookGroupe</Trans>
          <span className="valeur">
            <a href={facebookGroupe}>
              {facebookGroupe}
            </a>
          </span>
        </Row>
      )
    }
    if(idmg) {
      contact.push(
        <Row key="valeur idmg">
          <Trans>application.millegrille_idmg</Trans>
          <span className="idmg">{idmg}</span>
        </Row>
      )
    }

    return (
      <Container fluid className="footer bg-info">
        <Row>
          <Col>
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
    document.title = traduire(configuration, 'nomMilleGrille', language, configuration) || vitrineDescription;
  } else {
    document.title = vitrineDescription;
  }
}
