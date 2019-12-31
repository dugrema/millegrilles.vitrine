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

    var contenuConfiguration;
    if(this.props.configuration) {
      contenuConfiguration = this.props.configuration.contenuPage;
    }

    var descriptif, messageBienvenue;
    if(contenuConfiguration && contenuConfiguration.descriptif) {
      descriptif = (<p>{traduire(contenuConfiguration, 'descriptif', this.props.language)}</p>);
    }
    if(this.state.contenu && this.state.contenu.contenuPage) {
      const contenuPage = this.state.contenu.contenuPage;
      if(contenuPage.messageBienvenue) {
        let texte = traduire(contenuPage, 'messageBienvenue', this.props.language);
        messageBienvenue = (<p>{texte}</p>);
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
