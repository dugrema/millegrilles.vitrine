import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';
import './blogs.css';

const PODCASTS_LIBELLE = 'page.podcasts', PODCASTS_URL = '/podcasts.json';

export class PodcastsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return PODCASTS_LIBELLE;
  }

  getDocumentUrl() {
    return PODCASTS_URL;
  }

  render() {
    const podcasts = [];

    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>podcasts.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        {this._renderPodcasts()}
      </Container>
    );
  }

  _renderPodcasts() {
    var podcastsElements;

    if(this.state.contenu && this.state.contenu.podcasts) {
      const podcasts = this.state.contenu.podcasts;
      if(podcasts && podcasts.length > 0) {
        podcastsElements = [];
        const anneeCourante = new Date().getFullYear();

        for(let idx in podcasts) {
          let podcast = podcasts[idx];
          let image, sujet, texte, dateElement;
          if(podcast.titre) {
            sujet = (
              <h3 className="titre-podcast">
                {traduire(podcast, 'titre', this.props.language)}
              </h3>
            );
          }
          if(podcast.texte) {
            texte = (<p>{traduire(podcast, 'texte', this.props.language)}</p>)
          }
          if(podcast.modifie) {
            dateElement = this.renderDateModifiee(podcast.modifie);
          }
          if(podcast.thumbnail) {
            image = (
              <img
                width={128}
                className="align-self-start mr-3"
                src={podcast.thumbnail}
                srcset={podcast.image + ' 600w'}
                alt={traduire(podcast, 'titre', this.props.language)}
                />
            )
          }
          podcastsElements.push(
            <Row key={idx} className="podcast">
              <Col sm={2}>
                {image}
                {dateElement}
              </Col>
              <Col sm={10}>
                {sujet}
                {texte}
              </Col>
            </Row>
          );
        }
      }
    }

    if(!podcastsElements) {
      podcastsElements = (
        <Row key={1} className="podcast">
          <Col><p><Trans>podcasts.aucun</Trans></p></Col>
        </Row>
      );
    }

    return podcastsElements;
  }
}
