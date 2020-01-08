import React from 'react';
import {Card, CardColumns, Carousel, Button,
        Container, Row, Col} from 'react-bootstrap';
import {SectionVitrine, CollectionVitrine} from './sections';

import './albums.css';

const NOM_SECTION = 'albums';
const ALBUMS_LIBELLE = 'page.' + NOM_SECTION, ALBUMS_URL = NOM_SECTION + '.json';

export class AlbumsVitrine extends SectionVitrine {

  constructor() {
    super();
    const state = {
      collectionCourante: null,
    }
    this.setState(state);
  }

  getNomSection() {
    return NOM_SECTION;
  }

  getDocumentLibelle() {
    return ALBUMS_LIBELLE;
  }

  getDocumentUrl() {
    return ALBUMS_URL;
  }

  render() {

    let page;
    if(this.state.collectionCourante) {
      page = (
        <RenderCollection
          uuid={this.state.collectionCourante}
          retourPageAlbums={this.retourPageAlbums}/>);
    } else {
      page = (
        <RenderPageAlbums
          contenu={this.state.contenu}
          selectionner={this.selectionnerCollection}/>);
    }

    return page;
  }

  selectionnerCollection = event => {
    let uuid = event.currentTarget.dataset.uuid;
    console.debug("Selectionner collection " + uuid);
    this.setState({collectionCourante: uuid});
  }

  retourPageAlbums = event => {
    this.setState({collectionCourante: null});
  }

}

function RenderPageAlbums(props) {
  var imagesRecentes, collections;
  if(props.contenu) {
    if(props.contenu.recent) {
      imagesRecentes = props.contenu.recent;
    }
    if(props.contenu.collections) {
      collections = props.contenu.collections;
    }
  }

  return (
    <div>
      <RenderCarousel images={imagesRecentes}/>
      <GenererListeCartes
        images={collections}
        selectionner={props.selectionner} />
    </div>
  );
}

// Affiche un carousel en fonction d'une liste d'images
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
            <source type={element.mimetype} srcSet={'/consignation/' + element.image} media=" (min-width: 600px)"/>
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

// Genere des colonnes d'images en fonction d'une liste
function GenererListeCartes(props) {
  const listeRendered = [];
  if(props.images) {
    for(let idx in props.images) {
      let element = props.images[idx];
      let descriptif = element.descriptif || element.legende || element.commentaires || element.nom;

      var legende;
      if(descriptif) {
        legende = (
          <Card.Body>
            <Card.Text>{descriptif}</Card.Text>
          </Card.Body>
        );
      }

      var listeImages = [];
      if(element.mimetype && (element.image || element.path)) {
        var imagePath = '/consignation/' + (element.image || element.path);
        listeImages.push(
          <source key={element.uuid + 'source'} className="d-block w-100" type={element.mimetype} srcSet={imagePath} media=" (min-width: 600px)"/>
        );
      }
      listeImages.push(
        <img key={element.uuid + 'img'} className="d-block w-100" src={element.thumbnail} alt={descriptif}/>
      );

      listeRendered.push(
        <Card key={element.uuid} onClick={props.selectionner} data-uuid={element.uuid} data-path={element.path}>
          <picture>
            {listeImages}
          </picture>
          {legende}
        </Card>
      );
    }
  }

  if(listeRendered.length > 0) {
    return (
      <CardColumns>
        {listeRendered}
      </CardColumns>
    )
  }

  return null;
}

class RenderCollection extends CollectionVitrine {

  getUuid() {
    return this.props.uuid;
  }

  render() {
    var nomCollection, images, description;
    if(this.state.contenu) {
      nomCollection = this.state.contenu.nom;
      images = this._preparerImages();
      description = this.state.contenu.descriptif || this.state.contenu.commentaires;
    }

    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2>{nomCollection}</h2>
            <hr/>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>{description}</p>
            <Button onClick={this.props.retourPageAlbums}>Retour</Button>
          </Col>
        </Row>
        <Row><Col><GenererListeCartes images={images} selectionner={this._afficherImage}/></Col></Row>
      </Container>
    )
  }

  _preparerImages() {
    const images = [];
    if(this.state.contenu && this.state.contenu.documents) {
      const documents = this.state.contenu.documents;
      for(let uuidImage in documents) {
        let image = documents[uuidImage];
        images.push(image);
      }
    }
    return images;
  }

  _afficherImage = event => {
    let path = event.currentTarget.dataset.path;
    console.debug("Afficher image " + path);
    window.location.href = '/consignation/' + path;
  }

}
