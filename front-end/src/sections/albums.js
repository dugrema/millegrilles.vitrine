import React from 'react';
import {Card, CardColumns, Carousel} from 'react-bootstrap';
import {SectionVitrine} from './sections';

import './albums.css';

const ALBUMS_LIBELLE = 'page.albums', ALBUMS_URL = 'albums.json';

export class AlbumsVitrine extends SectionVitrine {

  constructor() {
    super();
    const state = {
      collectionCourante: null,
    }
    this.setState(state);
  }

  getDocumentLibelle() {
    return ALBUMS_LIBELLE;
  }

  getDocumentUrl() {
    return ALBUMS_URL;
  }

  render() {

    var imagesRecentes = null;
    if(this.state.contenu && this.state.contenu.recent) {
      imagesRecentes = this.state.contenu.recent;
    }

    return (
      <div>
        <RenderCarousel images={imagesRecentes}/>
        {this._renderCollections()}
      </div>
    );
  }

  _renderRecent() {

    var liste = null;
    if(this.state.contenu) {
      const recents = this.state.contenu.recent;
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
    if(this.state.contenu) {
      const collections = this.state.contenu.collections;
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
          <picture>
            <source className="d-block w-100" type={element.mimetype} srcSet={element.image} media=" (min-width: 600px)"/>
            <img className="d-block w-100" src={element.thumbnail} alt={descriptif}/>
          </picture>
          {legende}
        </Card>
      );
    }

    return listeRendered;
  }

}

function RenderCarousel(props) {
  var liste = null;
  if(props.images) {
    liste = [];
    const listeImages = props.images;
    for(let idx in listeImages) {
      let element = listeImages[idx];
      let descriptif = element.descriptif || element.legende;

      var legende;
      if(descriptif) {
        legende = (
          <Carousel.Caption>
            <p>{descriptif}</p>
          </Carousel.Caption>
        );
      }

      liste.push(
        <Carousel.Item key={idx}>
          <picture>
            <source type={element.mimetype} srcSet={element.image} media=" (min-width: 600px)"/>
            <img className="d-block w-100" src={element.thumbnail} alt={descriptif}/>
          </picture>
          {legende}
        </Carousel.Item>
      );
    }
  }

  return (
    <Carousel className="carousel" interval={5000}>
      {liste}
    </Carousel>
  );
}
