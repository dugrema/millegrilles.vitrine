import React from 'react';
import axios from 'axios';

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
      this.setState({contenu});

      let lastModified = contenu.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    // Tenter de charger une version mise a jour a partir du serveur
    axios.get('/defauts' + url, {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder le contenu mis a jour localement
        const contenuPage = resp.data;
        const contenu = {
          contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        this.setState({contenu});
        localStorage.setItem(libelle, JSON.stringify(contenu));
      }
    })
    .catch(err=>{
      console.error("Erreur acces page " + libelle);
      console.error(err);
    })

  }

}
