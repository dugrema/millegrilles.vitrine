import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';

import { traduire } from '../langutils.js';

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

    var descriptif, messageBienvenue;
    if(configurationMilleGrille && configurationMilleGrille.descriptif) {
      descriptif = (<p>{traduire(configurationMilleGrille, 'descriptif', this.props.language)}</p>);
    }
    if(pageAccueil && pageAccueil.messageBienvenue) {
      let texte = traduire(pageAccueil, 'messageBienvenue', this.props.language);
      messageBienvenue = (<p>{texte}</p>);
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
              <Image src="/logo128.png"/>
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

  _renderMedia(media) {
    const mediaList = [];

    for(let idx in media) {
      let medium = media[idx];

      var image, titre, texte, footer;
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
        titre = (<h3>{traduire(medium, 'titre', this.props.language)}</h3>)
      }
      if(medium.texte) {
        texte = [];
        let paragraphes = traduire(medium, 'texte', this.props.language);
        for(let idxPara in paragraphes) {
          let paragraphe = paragraphes[idxPara];
          texte.push(<p key={idxPara}>{paragraphe}</p>)
        }
      }
      if(medium.modifie) {
        const dateModifiee = new Date(medium.modifie * 1000);
        footer = (<p className="mediaFooter"><Trans values={{date: dateModifiee}}>accueil.dateModifiee</Trans></p>)
      }

      mediaList.push(
        <Media key={idx} className="blogpost">
          {image}
          <Media.Body>
            {titre}
            {texte}
            {footer}
          </Media.Body>
        </Media>
      );
    }

    return mediaList;
  }
}
