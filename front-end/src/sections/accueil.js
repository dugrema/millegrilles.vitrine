import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button,
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
    }

    return contenuPageAccueil;
  }

  _renderJumbotron() {

    var idmg, descriptif, messageBienvenue;

    if(this.props.configuration) {
      idmg = this.props.configuration.contenuPage.idmg;
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
            <Col>
              <h1>{descriptif}</h1>
              {idmg}
              {messageBienvenue}
            </Col>
            <Col>
              <i className="fa fa-clone fa-5x w3-padding-64 w3-text-red"></i>
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
}
