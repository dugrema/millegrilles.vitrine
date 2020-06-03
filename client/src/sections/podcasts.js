import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col, Button} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';
import './podcasts.css';

const NOM_SECTION = 'podcasts';
const PODCASTS_LIBELLE = 'page.' + NOM_SECTION, PODCASTS_URL = NOM_SECTION + '.json';

export class PodcastsVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

  getDocumentLibelle() {
    return PODCASTS_LIBELLE;
  }

  getDocumentUrl() {
    return PODCASTS_URL;
  }

  render() {
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

        for(let idx in podcasts) {
          let podcast = podcasts[idx];
          let image, sujet, texte, dateElement, audio, lien;

          if(podcast.path) {
            audio = (
              <audio controls>
                <source src={'/' + podcast.path} type={podcast.mimetype}/>
                <Trans>Your browser does not support the audio element.</Trans>
              </audio>
            )
          }
          if(podcast.titre) {
            sujet = (
              <h3 className="titre-podcast">
                {traduire(podcast, 'titre', this.props.language)}
              </h3>
            );
          }
          if(podcast.path && podcast.titre) {
            lien = (
              <p>
                <Button variant="danger" href={"/" + podcast.path} download={podcast.titre}>
                  <Trans>podcasts.telecharger</Trans>
                </Button>
              </p>
            )
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
                {audio}
                {lien}
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
