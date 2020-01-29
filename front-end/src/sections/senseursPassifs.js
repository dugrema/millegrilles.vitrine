import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';

import './senseursPassifs.css';

const NOM_SECTION = 'senseursPassifs';
const SENSEURSPASSIFS_LIBELLE = 'page.' + NOM_SECTION, SENSEURSPASSIFS_URL = NOM_SECTION + '.json';

export class SenseursPassifsVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

  getDocumentLibelle() {
    return SENSEURSPASSIFS_LIBELLE;
  }

  getDocumentUrl() {
    return SENSEURSPASSIFS_URL;
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
      // console.debug(senseur);
      const locationSenseur = senseur.location || cleSenseur;
      const batterieIcon = getBatterieIcon(senseur);

      listeSenseurs.push(
        <Row key={cleSenseur} className="senseur-header">
          <Col lg={7}>
            <span className="label d-block d-lg-none"><Trans>senseursPassifs.location</Trans><br/></span>
            {locationSenseur}
          </Col>
          <Col lg={4}>
            <span className="label d-block d-lg-none"><Trans>senseursPassifs.batterie</Trans><br/></span>
            {batterieIcon}
          </Col>
        </Row>
      );

      if(senseur.affichage) {

        // Trier par ordre de location, uuid
        var clesAppareilTriees = Object.keys(senseur.affichage);
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

          // Veririer si lecture plus vieille que 2 minutes
          var cssExpire = null;
          if(appareil.timestamp * 1000 < (new Date().getTime()) - 2000) {
            cssExpire = ' expire';
          }

          listeSenseurs.push(
            <Row key={cleSenseur+cleAppareil}>
              <Col lg={4}>
                <span className="label d-block d-lg-none"><Trans>senseursPassifs.location</Trans><br/></span>
                {location}
              </Col>
              <Col lg={1} className="temperature">
                <span className="label d-block d-lg-none"><Trans>senseursPassifs.temperature</Trans><br/></span>
                <Trans values={{temperature: appareil.temperature}}>senseursPassifs.temperatureFormat</Trans>
              </Col>
              <Col lg={1} className="humidite">
                <span className="label d-block d-lg-none"><Trans>senseursPassifs.humidite</Trans><br/></span>
                <Trans values={{humidite: appareil.humidite}}>senseursPassifs.humiditeFormat</Trans>
              </Col>
              <Col lg={2} className="pression">
                <span className="label d-block d-lg-none"><Trans>senseursPassifs.pression</Trans><br/></span>
                <Trans values={{pression: appareil.pression}}>senseursPassifs.pressionFormat</Trans>
              </Col>
              <Col lg={4} className={"date " + cssExpire}>
                <span className="label d-block d-lg-none"><Trans>senseursPassifs.dateLecture</Trans><br/></span>
                <Trans values={{date: new Date(appareil.timestamp*1000)}}>senseursPassifs.dateLectureFormat</Trans>
              </Col>
            </Row>
          );
        });
      }

    });

    return (
      <Container key={nomNoeud}>
        <Row className="noeud-header">
          <h2>{nomNoeud}</h2>
        </Row>
        <Row className="noeud-table-header">
          <Col lg={4} className="d-none d-lg-block"><Trans>senseursPassifs.location</Trans></Col>
          <Col lg={1} className="d-none d-lg-block"><Trans>senseursPassifs.temperatureAbbrev</Trans></Col>
          <Col lg={1} className="d-none d-lg-block"><Trans>senseursPassifs.humidite</Trans></Col>
          <Col lg={2} className="d-none d-lg-block"><Trans>senseursPassifs.pression</Trans></Col>
          <Col lg={3} className="d-none d-lg-block"><Trans>senseursPassifs.dateLecture</Trans></Col>
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

// function formatterLecture(documentSenseur) {
//   let temperature = null, humidite = null, pression = null, timestamp = null;
//   if(documentSenseur.temperature) { temperature = (<span>{numberformatter.format_numberdecimals(documentSenseur.temperature, 1)}&deg;C</span>); }
//   if(documentSenseur.humidite) { humidite = (<span>{documentSenseur.humidite}%</span>); }
//   if(documentSenseur.pression) { pression = (<span>{documentSenseur.pression} kPa</span>); }
//   if(documentSenseur.timestamp) {
//     timestamp = dateformatter.format_monthhour(documentSenseur.timestamp);
//   }
//
//   var bat_mv, bat_reserve;
//   var batterieIcon = getBatterieIcon(documentSenseur);
//   if(documentSenseur.bat_mv) {
//     bat_mv = documentSenseur.bat_mv + ' mV';
//   }
//   if(documentSenseur.bat_reserve) {
//     bat_reserve = documentSenseur.bat_reserve + '%';
//   }
//
//   var nomSenseur = documentSenseur.location;
//   if(!nomSenseur || nomSenseur === '') {
//     nomSenseur = documentSenseur.uuid_senseur;
//   }
//
//   return {nomSenseur, temperature, humidite, pression, timestamp, batterieIcon, bat_mv, bat_reserve};
// }
