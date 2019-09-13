import React from 'react';
import {VitrineWebSocketHandler} from '../websocket';
import {dateformatter} from '../formatters'

import './SenseursPassifs.css';
const nomDomaine = 'senseursPassifs';

export class SenseursPassifsVitrine extends React.Component {

  state = {
    senseurs: null,
    noeuds: null,
    expiresSurNoeud: {},  // Liste de senseurs avec des dates expirees
  }

  // Intervalle pour le calcul des expirations de senseurs
  intervalleCalculExpiration = null;

  componentDidMount() {
    this.webSocketHandler = new VitrineWebSocketHandler(nomDomaine, this.messageMq);
    this.webSocketHandler.connecter();

    // this.props.webSocketHandler.chargerDomaine(nomDomaine, reponse=>this.setDocuments(reponse));

    this.webSocketHandler.enregistrerCallback('mq_message', this.messageMq);
    this.webSocketHandler.enregistrerCallback('documents', this.documentsMq);

    this.intervalleCalculExpiration = setInterval(this.calculerExpirations, 15000);
  }

  componentWillUnmount() {
    this.webSocketHandler.deconnecter();

    // Nettoyage interval calcul expiration senseurs
    clearInterval(this.intervalleCalculExpiration);
    this.intervalleCalculExpiration = null;
  }

  calculerExpirations = () => {
    // Methode appelee regulierement pour flagger les senseurs expires
    let senseurs_expires = {};

    // Calcule des senseurs expires dans un document de noeud
    let noeuds = this.state.noeuds;
    for(var noeud_nom in noeuds) {
      let noeud = noeuds[noeud_nom];
      for(var nosenseur in noeud.dict_senseurs) {
        let senseur = noeud.dict_senseurs[nosenseur];
        let id_cle = nosenseur+'@'+noeud_nom;
        let dateLecture = senseur['temps_lecture'];
        if(dateLecture) {
          let dateExpiree = (new Date().getTime()/1000) > dateLecture+120;
          if(dateExpiree) {
            senseurs_expires[id_cle] = true;
          }
        } else {
          senseurs_expires[id_cle] = true;
        }
      }
    }

    this.setState({expiresSurNoeud: senseurs_expires});
  }

  messageMq = message => {
    console.debug("Message MQ recu dans SenseursPassifs:");
    // console.debug(message);

    if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel') {
      let noeud = message.message;
      let noeuds = {...this.state.noeuds};
      noeuds[noeud.noeud] = noeud;
      this.setState({noeuds: noeuds}, ()=>{
        this.calculerExpirations();
      });
    } else if(message.routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel') {
      let senseur = message.message;
      let senseurs = {...this.state.senseurs};
      senseurs[senseur.senseur+'@'+senseur.noeud] = senseur;
      this.setState({senseurs: senseurs}, ()=>{
        this.calculerExpirations();
      });
    }
  }

  documentsMq = message => {
    console.debug("Documents MQ recus");
    // console.debug(message);
    this.setState({senseurs: message.senseurs, noeuds: message.noeuds}, ()=>{
      this.calculerExpirations();
    });
  }

  render() {
    return (
      <AfficherListeNoeuds
        noeuds={this.state.noeuds}
        expiresSurNoeud={this.state.expiresSurNoeud}
        />
    );
  }

}

class AfficherListeNoeuds extends React.Component {

  afficherNoeud(noeud) {

    let listeSenseurs = [];
    for(var noSenseur in noeud.dict_senseurs) {
      let senseur = noeud.dict_senseurs[noSenseur];
      // Veririer si lecture plus vieille que 2 minutes
      let classRow = 'w3-card w3-row-padding row-donnees';
      if(this.props.expiresSurNoeud[noSenseur+'@'+noeud.noeud]) {
        classRow += ' expiree';
      }

      // console.debug(senseur);
      let cleSenseur = noSenseur + '@' + noeud.noeud;
      listeSenseurs.push(
        <div key={cleSenseur} className={classRow}>
          <div className="w3-col m4 w3-text-blue-grey">{senseur.location}</div>
          <div className="w3-col m1 nowrap w3-small temperature">
            <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Température </span>{senseur.temperature}&deg;C
          </div>
          <div className="w3-col m1 nowrap w3-small humidite">
            <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Humidité </span>{senseur.humidite} %
          </div>
          <div className="w3-col m2 nowrap w3-small pression">
            <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Pression </span>{senseur.pression} kPa
          </div>
          <div className="w3-col m1 nowrap w3-small millivolt">
            <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Millivolt </span>{senseur.millivolt} mV
          </div>
          <div className="w3-col m1 nowrap w3-small date">
            <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Date</span>{dateformatter.format_datetime(senseur['temps_lecture'])}
          </div>
        </div>
      );
    }

    return (
      <div key={noeud.noeud}>
        <div className="w3-row-padding">
          <div className="w3-col m12 w3-row-padding">
            <h2 className="w3-text-blue-grey">{noeud.noeud}</h2>
          </div>
          <div className="w3-col m4 w3-hide w3-hide-small w3-show w3-show-medium">Location</div>
          <div className="w3-col m1 w3-hide w3-hide-small w3-show w3-show-medium">Tempér.</div>
          <div className="w3-col m1 w3-hide w3-hide-small w3-show w3-show-medium">Humidité</div>
          <div className="w3-col m2 w3-hide w3-hide-small w3-show w3-show-medium">Pression</div>
          <div className="w3-col m1 w3-hide w3-hide-small w3-show w3-show-medium">Millivolt</div>
          <div className="w3-col m3 w3-hide w3-hide-small w3-show w3-show-medium">Date</div>
        </div>
        {listeSenseurs}
      </div>
    );

  }

  render() {
    let noeudsRender = [];
    for(var noeudNom in this.props.noeuds) {
      // console.debug("Noeud: " + noeudNom);
      let noeud = this.props.noeuds[noeudNom];
      let contenuNoeud = this.afficherNoeud(noeud);
      noeudsRender.push(contenuNoeud);
    }

    return (
      <div className="w3-col m12">{noeudsRender}</div>
    );
  }

}
