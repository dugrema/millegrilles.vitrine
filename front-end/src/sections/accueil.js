import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image,
        Container, Row, Col} from 'react-bootstrap';
import {pathConsignation} from '../pathUtils';
import { traduire } from '../langutils.js';

import './accueil.css';

const NOM_SECTION = 'accueil';
const ACCUEIL_LIBELLE = 'page.' + NOM_SECTION, ACCUEIL_URL = NOM_SECTION + '.json';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class AccueilVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

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

    const contenuPage = this.state.contenu;
    if(contenuPage && contenuPage.portail) {
      for(let idx in contenuPage.portail) {
        const configPortlet = contenuPage.portail[idx];
        const typePortlet = configPortlet.type;

        if(typePortlet === 'deck') {
          contenuPageAccueil.push(this._renderCartes(configPortlet.cartes));
        } else if(typePortlet === 'blogs') {
          // contenuPageAccueil.push.apply(contenuPageAccueil, this._renderMedia(contenuPage.media));
        }
      }
    }

    return contenuPageAccueil;
  }

  _renderJumbotron() {

    const configurationMilleGrille = this.props.millegrille;
    const pageAccueil = this.state.contenu;

    var descriptif, messageBienvenue, image;
    if(configurationMilleGrille && configurationMilleGrille.nomMilleGrille) {
      descriptif = (<p>{traduire(configurationMilleGrille, 'nomMilleGrille', this.props.language)}</p>);
    }
    if(pageAccueil && pageAccueil.messageBienvenue) {
      let texte = traduire(pageAccueil, 'messageBienvenue', this.props.language);
      messageBienvenue = (<p>{texte}</p>);

      if(pageAccueil.thumbnail) {
        image = (<img src={PREFIX_DATA_URL + pageAccueil.thumbnail}/>);
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
              {image}
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

      if(carte.image || carte.thumbnail) {
        let imagesDef = [];
        if(carte.mimetype && carte.image) {
          imagesDef.push(
            <source key='highdef' type={carte.mimetype} srcSet={'/consignation/' + carte.image} media=" (min-width: 600px)"/>
          );
        }
        if(carte.thumbnail) {
          imagesDef.push(
            <Card.Img key='thumbnail' variant="top" src={PREFIX_DATA_URL + carte.thumbnail}/>
          );
        }

        image = (
          <picture>{imagesDef}</picture>
        );
      }
      if(carte.titre) {
        titre = (<Card.Title>{traduire(carte, 'titre', this.props.language)}</Card.Title>);
      }
      if(carte.texte) {
        texte = (<Card.Text>{traduire(carte, 'texte', this.props.language)}</Card.Text>);
      }
      if(carte.bouton) {
        bouton = (<Button variant="primary">{traduire(carte.bouton, 'texte', this.props.language)}</Button>);
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
