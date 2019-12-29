import React from 'react';
import {SectionVitrine} from './sections';

import './documents.css';

const DOCUMENTS_LIBELLE = 'page.documents', DOCUMENTS_URL = '/documents.json';

export class DocumentsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return DOCUMENTS_LIBELLE;
  }

  getDocumentUrl() {
    return DOCUMENTS_URL;
  }

  render() {
    return (
      <div>Allo documents<br/>Allo documents<br/>Allo documents<br/>Allo documents<br/></div>
    );
  }
}
