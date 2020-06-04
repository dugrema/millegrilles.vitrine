import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../components/langutils.js';

import './annonces.css';

const NOM_SECTION = 'annonces';
const ANNONCES_LIBELLE = 'page.' + NOM_SECTION,
      MESSAGES_URL = NOM_SECTION + '.json';

export class AnnoncesVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

  getDocumentLibelle() {
    return ANNONCES_LIBELLE;
  }

  getDocumentUrl() {
    return MESSAGES_URL;
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
        <RenderAnnonces />
      </Container>
    );
  }

}

function RenderAnnonces(props) {
  var messagesElements;

  if(props.contenu && props.contenu.annonces) {
    const messages = props.contenu.annonces;
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
        {traduire(message, 'sujet', this.props.language)}
      </h3>
    );
  }
  if(message.texte) {
    texte = (
      <p className="texte-message">
        {traduire(message, 'texte', this.props.language)}
      </p>
    );
  }
  if(message['_mg-creation']) {
    dateElement = this.renderDateModifiee(message['_mg-creation']);
  }

  return (
    <Row className="message">
      <Col sm={2}>
        {props.dateElement}
      </Col>
      <Col sm={10}>
        {props.sujet}
        {texte}
      </Col>
    </Row>
  )
}
