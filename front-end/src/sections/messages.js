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
    const blogposts = [];

    return (
      <Container>
        <Row>
          <Col>
            <h2><Trans>messages.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        <Row>
          <Col>{this._renderMessages()}</Col>
        </Row>
        <Row>
          <Col>{blogposts}</Col>
        </Row>
      </Container>

    );
  }

  _renderMessages() {
    var messagesElements;

    if(this.state.contenu && this.state.contenu.contenuPage && this.state.contenu.contenuPage.messages) {
      const messages = this.state.contenu.contenuPage.messages;
      if(messages) {
        messagesElements = [];

        for(let idx in messages) {
          let message = messages[idx];
          var image, titre, texte, footer;
          if(message.titre) {
            titre = (<h3>{traduire(message, 'titre', this.props.language)}</h3>);
          }
          if(message.texte) {
            texte = (<p>{traduire(message, 'texte', this.props.language)}</p>);
          }
          if(message.modifie) {
            const dateModifiee = new Date(message.modifie * 1000);
            footer = (<p className="mediaFooter"><Trans values={{date: dateModifiee}}>accueil.dateModifiee</Trans></p>)
          }
          messagesElements.push(
            <Media key={idx} className="blogpost">
              <Media.Body>
                {titre}
                {texte}
                {footer}
              </Media.Body>
            </Media>
          );
        }
      }
    }

    return messagesElements;
  }
}
