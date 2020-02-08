import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';

import './senseursPassifs.css';

const NOM_SECTION = 'senseursPassifs';
const SENSEURSPASSIFS_LIBELLE = 'page.' + NOM_SECTION, SENSEURSPASSIFS_URL = NOM_SECTION + '.json';
const DELAI_EXPIRATION_LECTURES = 120 * 1000; // Expiration lectures en ms

export class SenseursPassifsVitrine extends SectionVitrine {

  constructor(props) {
    super(props);

    this.state.appareilExpire = {};  // Ajoute le dict pour expiration appareils
  }

  getNomSection() {
    return NOM_SECTION;
  }

  getDocumentLibelle() {
    return SENSEURSPASSIFS_LIBELLE;
  }

  getDocumentUrl() {
    return SENSEURSPASSIFS_URL;
  }

  componentDidMount() {
    super.componentDidMount();
    // Verifier l'expiration des dates d'appareils a toutes les 5 secondes
    this.timerExpiration = setInterval(this.verifierExpiration, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timerExpiration);
    super.componentWillUnmount()
  }

  // S'assurer de mettre a jour les timeouts immediatement
  hookContenuMaj() {
    this.setState({expire: {}})  // Reset liste de senseurs expires
  }

  render() {
    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>senseursPassifs.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        {this._renderNoeuds()}
      </Container>
    );
  }

  _renderSenseursNoeud(nomNoeud, noeud) {

    if(noeud && Object.keys(noeud).length === 0) {
      return null;  // Rien a faire pour noeud vide
    }

    const listeSenseurs = [];
    const senseursTriesUuid = Object.keys(noeud);
    senseursTriesUuid.sort((a,b)=>{
      if(a===b) return 0;
      var locationA = noeud[a].location;
      var locationB = noeud[b].location;
      if(locationA && locationB){
        return locationA.localeCompare(locationB);
      }
      if(locationA) return 1;
      if(locationB) return -1;
      return a.localeCompare(b);
    });

    senseursTriesUuid.forEach(cleSenseur => {
      let senseur = noeud[cleSenseur];
      console.debug(senseur);
      const locationSenseur = senseur.location || cleSenseur;
      const batterieIcon = getBatterieIcon(senseur);

      if(senseur.affichage) {

        // Trier par ordre de location, uuid
        var clesAppareilTriees = Object.keys(senseur.affichage);

        // Prendre un appareil au hasard pour trouver la date
        var dateSenseur = null;
        var cssExpire = null;
        if(clesAppareilTriees && clesAppareilTriees[0]) {
          var cleAppareil = clesAppareilTriees[0];
          console.debug("Cle appareil : " + cleAppareil);
          var appareil = senseur.affichage[cleAppareil];
          dateSenseur = <Trans values={{date: new Date(appareil.timestamp*1000)}}>senseursPassifs.dateLectureFormat</Trans>;
          // Veririer si lecture plus vieille que 2 minutes
          if( (this.state.expire && this.state.expire[cleSenseur + '.' + cleAppareil]) ||
             appareil.timestamp * 1000 < (new Date().getTime()) - DELAI_EXPIRATION_LECTURES) {
            cssExpire = ' expire';
          }
        }

        listeSenseurs.push(
          <Row key={cleSenseur} className="senseur-header">
            <Col xs={8} lg={7}>
              {locationSenseur}
            </Col>
            <Col xs={1} lg={2}>
              {batterieIcon}
            </Col>
            <Col xs={3} lg={3} className={cssExpire}>
              {dateSenseur}
            </Col>
          </Row>
        );

        clesAppareilTriees.sort((a,b)=>{
          if(a===b) return 0;
          var locationA = senseur.affichage[a].location;
          var locationB = senseur.affichage[b].location;
          if(locationA && locationB){
            return locationA.localeCompare(locationB);
          }
          if(locationA) return 1;
          if(locationB) return -1;
          return a.localeCompare(b);
        });

        clesAppareilTriees.forEach(cleAppareil => {
          var appareil = senseur.affichage[cleAppareil];
          // var lectureFormatteeAppareil = formatterLecture(appareil);
          const location = appareil.location || cleAppareil;

          listeSenseurs.push(
            <Row key={cleSenseur+cleAppareil}>
              <Col xs={6} lg={5}>
                {location}
              </Col>
              <Col xs={2} lg={2} className="temperature">
                <Trans values={{temperature: appareil.temperature}}>senseursPassifs.temperatureFormat</Trans>
              </Col>
              <Col xs={2} lg={2} className="humidite">
                <Trans values={{humidite: appareil.humidite}}>senseursPassifs.humiditeFormat</Trans>
              </Col>
              <Col xs={2} lg={3} className="pression">
                <Trans values={{pression: appareil.pression}}>senseursPassifs.pressionFormat</Trans>
              </Col>
            </Row>
          );
        });
      }

    });

    return (
      <Container key={nomNoeud} className="noeud-block">
        <Row className="noeud-header">
          <h3>{nomNoeud}</h3>
        </Row>
        <Row className="noeud-table-header">
          <Col xs={5} lg={5} className="d-none d-lg-block"><Trans>senseursPassifs.location</Trans></Col>
          <Col xs={2} lg={2} className="d-none d-lg-block"><Trans>senseursPassifs.temperatureAbbrev</Trans></Col>
          <Col xs={2} lg={2} className="d-none d-lg-block"><Trans>senseursPassifs.humidite</Trans></Col>
          <Col xs={3} lg={3} className="d-none d-lg-block"><Trans>senseursPassifs.pression</Trans></Col>
        </Row>
        {listeSenseurs}
      </Container>
    );

  }

  _renderNoeuds() {
    var noeudsElements = [];

    if(this.state.contenu && this.state.contenu.noeuds) {
      const noeuds = this.state.contenu.noeuds;
      if(noeuds) {
        var nomsNoeudsTries = Object.keys(noeuds);

        // Trier les noeuds
        nomsNoeudsTries.sort((a, b)=>{
          if(a===b) return 0;
          return a.localeCompare(b);
        })

        nomsNoeudsTries.forEach(n => {
          let noeud = noeuds[n];
          noeudsElements.push(this._renderSenseursNoeud(n, noeud))
        });

      }
    }

    if(noeudsElements.length === 0) {
      noeudsElements = (
        <Row key={1} className="message">
          <Col><Trans>senseursPassifs.aucun</Trans></Col>
        </Row>
      );
    }

    return noeudsElements;
  }

  verifierExpiration = () => {
    // console.debug("Verifier expirations");
    const expire = {...this.state.expire};
    if(this.state.contenu && this.state.contenu.noeuds) {
      Object.values(this.state.contenu.noeuds).forEach(noeud=>{
        // Le noeud est un dict d'appareils
        for(let uuid in noeud) {
          let appareil = noeud[uuid];
          // On prend juste les senseurs dans affichage
          for(let idAppareil in appareil.affichage) {
            let senseur = appareil.affichage[idAppareil];
            if(senseur.timestamp * 1000 < (new Date().getTime()) - DELAI_EXPIRATION_LECTURES) {
              // console.debug("Expire: " + uuid)
              expire[uuid + '.' + idAppareil] = true;
            }
          }
        }
      })
    }

    this.setState({expire})
  }

}

function getBatterieIcon(documentSenseur) {
  if(!documentSenseur) return null;

  var batterieIcon = null;
  if(documentSenseur.bat_reserve > 100) {
    batterieIcon = (<i className="fa fa-bug"/>);
  } else if(documentSenseur.bat_reserve === 100) {
    batterieIcon = (<i className="fa fa-bolt"/>);
  } else if(documentSenseur.bat_reserve < 100 && documentSenseur.bat_reserve > 80) {
    batterieIcon = (<i className="fa fa-battery-full"/>);
  } else if(documentSenseur.bat_reserve > 66) {
    batterieIcon = (<i className="fa fa-battery-three-quarters"/>);
  } else if(documentSenseur.bat_reserve > 33) {
    batterieIcon = (<i className="fa fa-battery-half"/>);
  } else if(documentSenseur.bat_reserve > 5) {
    batterieIcon = (<i className="fa fa-battery-quarter"/>);
  } else if(documentSenseur.bat_reserve > 0) {
    batterieIcon = (<i className="fa fa-battery-empty"/>);
  } else {
    batterieIcon = (<i className="fa fa-bug"/>);
  }

  return batterieIcon;
}
