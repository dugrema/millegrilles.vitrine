import React from 'react';
import {SectionVitrine} from './sections';

import './fichiers.css';

const FICHIERS_LIBELLE = 'page.fichiers', FICHIERS_URL = '/fichiers.json';

export class FichiersVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return FICHIERS_LIBELLE;
  }

  getDocumentUrl() {
    return FICHIERS_URL;
  }

  render() {
    return (
      <div>Allo fichiers<br/>Allo fichiers<br/>Allo fichiers<br/>Allo fichiers<br/></div>
    );
  }
}
