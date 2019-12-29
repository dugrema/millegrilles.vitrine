import React from 'react';
import {SectionVitrine} from './sections';

import './albums.css';

const ALBUMS_LIBELLE = 'page.albums', ALBUMS_URL = '/albums.json';

export class AlbumsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return ALBUMS_LIBELLE;
  }

  getDocumentUrl() {
    return ALBUMS_URL;
  }

  render() {
    return (
      <div>Allo album<br/>Allo album<br/>Allo album<br/>Allo album<br/></div>
    );
  }
}
