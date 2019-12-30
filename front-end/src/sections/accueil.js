import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import './accueil.css';

const ACCUEIL_LIBELLE = 'page.accueil', ACCUEIL_URL = '/accueil.json';

export class AccueilVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return ACCUEIL_LIBELLE;
  }

  getDocumentUrl() {
    return ACCUEIL_URL;
  }

  render() {
    var contenuPageAccueil = [
      this._renderJumbotron()
    ];

    if(this.state.contenu && this.state.contenu.contenuPage) {
      const contenuPage = this.state.contenu.contenuPage;
      if(contenuPage.cartes) {
        contenuPageAccueil.push(this._renderCartes(contenuPage.cartes));
      }
      if(contenuPage.media) {
        contenuPageAccueil.push.apply(contenuPageAccueil, this._renderMedia(contenuPage.media));
      }
    }

    return contenuPageAccueil;
  }

  _renderJumbotron() {

    var descriptif, messageBienvenue;

    if(this.props.configuration) {
      descriptif = (<p>{this.props.configuration.contenuPage.descriptif}</p>);
    }
    if(this.state.contenu && this.state.contenu.contenuPage) {
      const contenuPage = this.state.contenu.contenuPage;
      if(contenuPage.messageBienvenue) {
        messageBienvenue = (<p>{contenuPage.messageBienvenue}</p>);
      }
    }

    return (
      <Jumbotron key='accueilHaut'>
        <Container>
          <Row>
            <Col lg={9}>
              <h1>{descriptif}</h1>
              <hr/>
              {messageBienvenue}
            </Col>
            <Col>
              <Image src="/logo128.png" rounded/>
            </Col>
          </Row>
        </Container>
      </Jumbotron>
    );
  }

  _renderCartes(cartes) {
    const listeCartes = [];
    for(let idx in cartes) {
      const carte = cartes[idx];
      var image = null;
      var titre = null;
      var texte = null;
      var bouton = null;

      if(carte.image) {
        image = (<Card.Img variant="top" src={"/" + carte.image} />);
      }
      if(carte.titre) {
        titre = (<Card.Title>{carte.titre}</Card.Title>);
      }
      if(carte.texte) {
        texte = (<Card.Text>{carte.texte}</Card.Text>);
      }
      if(carte.bouton) {
        bouton = (<Button variant="primary">{carte.bouton.texte}</Button>);
      }
      listeCartes.push(
        <Card key={idx}>
          {image}
          <Card.Body>
            {titre}
            {texte}
            {bouton}
          </Card.Body>
        </Card>
      );
    }

    const cardDeck = (
      <CardDeck key='accueilBas'>
        {listeCartes}
      </CardDeck>
    );

    return cardDeck;
  }

  _renderMedia(media) {
    const mediaList = [];

    for(let idx in media) {
      let medium = media[idx];

      var image, titre, texte;
      if(medium.image) {
        image = (
          <img
            width={128}
            className="align-self-start mr-3"
            src={medium.image}
            alt={medium.titre}
            />);
      }
      if(medium.titre) {
        titre = (<h3>{medium.titre}</h3>)
      }
      if(medium.texte) {
        texte = [];
        for(let idxPara in medium.texte) {
          let paragraphe = medium.texte[idxPara];
          texte.push(<p key={idxPara}>{paragraphe}</p>)
        }
      }

      mediaList.push(
        <Media key={idx}>
          {image}
          <Media.Body>
            {titre}
            {texte}
          </Media.Body>
        </Media>
      );
    }

    return mediaList;
  }
}
