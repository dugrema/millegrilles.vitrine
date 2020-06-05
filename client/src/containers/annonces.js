import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../components/langutils.js';

import './annonces.css';

const NOM_SECTION = 'annonces';
const CONFIGURATION_DOCUMENTS = {
  'annonces': {pathFichier: '/annonces/annonces.json'},
}

export class AnnoncesVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

  getConfigDocuments() {
    return CONFIGURATION_DOCUMENTS
  }

  render() {
    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>annonces.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        <RenderAnnonces annonces={this.state.annonces} />
      </Container>
    );
  }

}

function RenderAnnonces(props) {
  var messagesElements = null;

  if(props.annonces) {
    const messages = props.annonces.annonces;
    if(messages && messages.length > 0) {
      messagesElements = [];

      for(let idx in messages) {
        messagesElements.push(
          <Annonce key={idx} message={messages[idx]} />
        );
      }
    } else {
      messagesElements = (
        <Row className="message">
          <Col><Trans>messages.aucun</Trans></Col>
        </Row>
      );
    }
  }

  return messagesElements;
}

function Annonce(props) {

  const message = props.message

  let sujet, texte, dateElement;
  if(message.sujet) {
    sujet = (
      <h3 className="sujet-message">
        {traduire(message, 'sujet', props.language)}
      </h3>
    );
  }
  if(message.texte) {
    texte = (
      <p className="texte-message">
        {traduire(message, 'texte', props.language)}
      </p>
    );
  }
  if(message['_mg-creation']) {
    // dateElement = renderDateModifiee(message['_mg-creation']);
    dateElement = message['_mg-creation']
  }

  return (
    <Row className="message">
      <Col sm={2}>
        {dateElement}
      </Col>
      <Col sm={10}>
        {sujet}
        {texte}
      </Col>
    </Row>
  )
}
