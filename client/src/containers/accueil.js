import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button,
        Container, Row, Col} from 'react-bootstrap';
import {pathConsignation} from '../components/pathUtils';
import { traduire } from '../components/langutils.js';

import './accueil.css';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class AccueilVitrine extends SectionVitrine {

  NOM_SECTION = 'accueil'

  CONFIGURATION_DOCUMENTS = {
    'accueil': {pathFichier: '/accueil/accueil.json'},
  }

  getConfigDocuments() {
    return this.CONFIGURATION_DOCUMENTS
  }

  getNomSection() {
    return this.NOM_SECTION
  }

  render() {
    var contenuPageAccueil = [
      this._renderJumbotron()
    ];

    const contenuPage = this.state.accueil;
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

    const nomMilleGrille = this.props.rootProps.nomMilleGrille;
    const pageAccueil = this.state.accueil;

    var descriptif, messageBienvenue, image;
    if(nomMilleGrille) {
      descriptif = (<p>{nomMilleGrille}</p>);
    }
    if(pageAccueil && pageAccueil.messageBienvenue) {
      let texte = traduire(pageAccueil, 'messageBienvenue', this.props.language, null);
      messageBienvenue = (<p>{texte}</p>);

      if(pageAccueil.thumbnail) {
        image = (<img alt="Thumbnail colonne" src={PREFIX_DATA_URL + pageAccueil.thumbnail}/>);
      }
    }

    return (
      <div key='accueilHaut'>
        <br/><br/><br/>
        <Jumbotron>
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
      </div>
    );
  }

  _renderCartes(cartes) {
    const listeCartes = [];
    for(let idx in cartes) {
      const carte = cartes[idx];
      var image = null, titre = null, texte = null, bouton = null, liens = null;

      if(carte.image) {
        let imagesDef = [];
        if(carte.image.mimetype_preview && carte.image.fuuid_preview && this.props.configuration) {
          var imagePath = pathConsignation(carte.image.fuuid_preview, {extension: 'jpg'}, this.props.configuration.consignation);
          imagesDef.push(
            <source key='highdef' type={carte.image.mimetype_preview} srcSet={imagePath} media=" (min-width: 600px)"/>
          );
        }
        if(carte.image.thumbnail) {
          imagesDef.push(
            <Card.Img key='thumbnail' variant="top" src={PREFIX_DATA_URL + carte.image.thumbnail}/>
          );
        }

        image = (
          <picture>{imagesDef}</picture>
        );
      }
      if(carte.titre) {
        titre = (<Card.Title>{traduire(carte, 'titre', this.props.language, this.props.millegrille)}</Card.Title>);
      }
      if(carte.texte) {
        // Traduire texte et generer paragraphes
        var texteColonne = traduire(carte, 'texte', this.props.language, this.props.millegrille);
        texte = (<Card.Text>{texteColonne}</Card.Text>);
      }
      if(carte.bouton) {
        bouton = (<Button variant="primary">{traduire(carte.bouton, 'texte', this.props.language, this.props.millegrille)}</Button>);
      }
      if(carte.liens) {
        let listeLiens = [];
        for(let idx in carte.liens) {
          var lien = carte.liens[idx];
          let href = null;
          if(lien.url) {
            href = (<span>: <a href={lien.url}>{lien.url}</a></span>)
          }
          listeLiens.push(
            <li key={idx}>
              {traduire(lien, 'texte', this.props.language, this.props.millegrille)} {href}
            </li>
          )
        }

        liens = (
          <ul className="liste-accueil">{listeLiens}</ul>
        )
      }
      listeCartes.push(
        <Card key={idx}>
          {image}
          <Card.Body>
            {titre}
            {texte}
            {liens}
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
