import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';

import './messages.css';

const MESSAGES_LIBELLE = 'page.messages', MESSAGES_URL = '/messages.json';

export class MessagesVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return MESSAGES_LIBELLE;
  }

  getDocumentUrl() {
    return MESSAGES_URL;
  }

  render() {
    const messages = [];

    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>messages.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        {this._renderMessages()}
      </Container>
    );
  }

  _renderMessages() {
    var messagesElements;

    if(this.state.contenu && this.state.contenu.messages) {
      const messages = this.state.contenu.messages;
      if(messages && messages.length > 0) {
        messagesElements = [];

        for(let idx in messages) {
          let message = messages[idx];
          let image, sujet, texte, dateElement;
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
          if(message.modifie) {
            dateElement = this.renderDateModifiee(message.modifie);
          }
          messagesElements.push(
            <Row key={idx} className="message">
              <Col sm={2}>
                {dateElement}
              </Col>
              <Col sm={10}>
                {sujet}
                {texte}
              </Col>
            </Row>
          );
        }
      } else {
        messagesElements = (
          <Row key={1} className="message">
            <Col><Trans>messages.aucun</Trans></Col>
          </Row>
        );
      }
    }

    return messagesElements;
  }
}
