import React from 'react';
import axios from 'axios';
import { Trans } from 'react-i18next';

export class SectionVitrine extends React.Component {

  state = {
    contenu: null,
  }

  componentDidMount() {
    this._chargerPage(this.getDocumentLibelle(), this.getDocumentUrl());
  }

  // Charge le fichier json qui s'occupe du contenu de cette page
  // libelle: Nom dans localStorage (e.g. page.accueil)
  // url: URL relatif sur le serveur (e.g. /defaut/accueil.json)
  _chargerPage(libelle, url) {
    let contenuPageStr = localStorage.getItem(libelle);

    const headers = {};
    if(contenuPageStr) {
      const contenu = JSON.parse(contenuPageStr);
      this.setState({contenu: contenu.contenu});

      let lastModified = contenu.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    // Tenter de charger une version mise a jour a partir du serveur
    axios.get('/data/' + url, {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      // console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder le contenu mis a jour localement
        const contenuPage = resp.data;
        const contenu = {
          contenu: contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        this.setState({contenu: contenuPage});
        localStorage.setItem(libelle, JSON.stringify(contenu));
      }
    })
    .catch(err=>{
      console.error("Erreur acces page " + libelle);
      console.error(err);
    })

  }

  renderDateModifiee(dateModifieeEpoch) {
    const anneeCourante = new Date().getFullYear();
    const dateModifiee = new Date(dateModifieeEpoch * 1000);
    let labelDate;
    if(dateModifiee.getFullYear() === anneeCourante) {
      labelDate = 'accueil.dateModifiee';
    } else {
      labelDate = 'accueil.dateAnneeModifiee';
    }

    var dateElement = (
      <div className="date-message">
        <div className="date-modifiee">
          <Trans values={{date: dateModifiee}}>{labelDate}</Trans>
        </div>
        <div className="heure-modifiee">
          <Trans values={{date: dateModifiee}}>accueil.heureModifiee</Trans>
        </div>
      </div>
    )

    return dateElement;
  }

}

export class CollectionVitrine extends React.Component {

  state = {
    contenu: null,
  };

  componentDidMount() {
    this._chargerCollection(this.getUuid());
  }

  // Charge le fichier json qui s'occupe du contenu de cette page
  // libelle: Nom dans localStorage (e.g. page.accueil)
  // url: URL relatif sur le serveur (e.g. /defaut/accueil.json)
  _chargerCollection(libelle) {
    let contenuPageStr = sessionStorage.getItem(libelle);

    const headers = {};
    if(contenuPageStr) {
      const contenu = JSON.parse(contenuPageStr);
      this.setState({contenu: contenu.contenu});

      let lastModified = contenu.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    // Tenter de charger une version mise a jour a partir du serveur
    axios.get('/data/collections/' + this.props.uuid + '.json', {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      // console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder le contenu mis a jour localement
        const contenuPage = resp.data;
        const contenu = {
          contenu: contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        this.setState({contenu: contenuPage});
        sessionStorage.setItem(libelle, JSON.stringify(contenu));
      }
    })
    .catch(err=>{
      console.error("Erreur acces collection " + libelle);
      console.error(err);
    })

  }

}
