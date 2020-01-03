import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';

import './podcasts.css';

const PODCASTS_LIBELLE = 'page.podcasts', PODCASTS_URL = '/pdocasts.json';

export class PodcastsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return PODCASTS_LIBELLE;
  }

  getDocumentUrl() {
    return PODCASTS_URL;
  }

  render() {
    return (
      <Container>
        <Row>
          <Col>
            <h2><Trans>podcasts.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
      </Container>

    );
  }

}
