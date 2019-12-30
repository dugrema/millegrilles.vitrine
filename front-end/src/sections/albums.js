import React from 'react';
import {Card, CardColumns, Carousel} from 'react-bootstrap';
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
      <div>
        {this._renderRecent()}
        {this._renderCollections()}
      </div>
    );
  }

  _renderRecent() {

    var liste = null;
    if(this.state.contenu && this.state.contenu.contenuPage) {
      const recents = this.state.contenu.contenuPage.recent;
      liste = this._genererListeCarousel(recents);
    }

    return (
      <Carousel className="carousel" interval={5000}>
        {liste}
      </Carousel>
    );
  }

  _renderCollections() {

    var collectionsListe = null;
    if(this.state.contenu && this.state.contenu.contenuPage) {
      const collections = this.state.contenu.contenuPage.collections;
      collectionsListe = this._genererListeCartes(collections);
    }

    return (
      <CardColumns>
        {collectionsListe}
      </CardColumns>
    );
  }

  _genererListeCartes(liste) {
    const listeRendered = [];
    for(let idx in liste) {
      let element = liste[idx];
      let descriptif = element.descriptif || element.legende;

      var legende;
      if(descriptif) {
        legende = (
          <Card.Body>
            <Card.Text>{descriptif}</Card.Text>
          </Card.Body>
        );
      }

      listeRendered.push(
        <Card key={idx}>
          <Card.Img variant="top" src={element.thumbnail} />
          {legende}
        </Card>
      );
    }

    return listeRendered;
  }

  _genererListeCarousel(liste) {
    const listeRendered = [];
    for(let idx in liste) {
      let element = liste[idx];
      let descriptif = element.descriptif || element.legende;

      var legende;
      if(descriptif) {
        legende = (
          <Carousel.Caption>
            <p>{descriptif}</p>
          </Carousel.Caption>
        );
      }

      listeRendered.push(
        <Carousel.Item key={idx}>
          <img className="d-block w-100" src={element.thumbnail} alt={descriptif}/>
          {legende}
        </Carousel.Item>
      );
    }

    return listeRendered;
  }
}
