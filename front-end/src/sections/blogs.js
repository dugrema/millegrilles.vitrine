import React from 'react';
import {SectionVitrine} from './sections';
import {Jumbotron, Card, CardDeck, Button, Image, Media,
        Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';
import './blogs.css';

const BLOGS_LIBELLE = 'page.blogs', BLOGS_URL = '/blogs.json';

export class BlogsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return BLOGS_LIBELLE;
  }

  getDocumentUrl() {
    return BLOGS_URL;
  }

  render() {
    const messages = [];

    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>blogs.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        {this._renderBlogs()}
      </Container>
    );
  }

  _renderBlogs() {
    var blogpostsElements;

    if(this.state.contenu && this.state.contenu.blog) {
      const blogposts = this.state.contenu.blog;
      if(blogposts && blogposts.length > 0) {
        blogpostsElements = [];
        const anneeCourante = new Date().getFullYear();

        for(let idx in blogposts) {
          let blogpost = blogposts[idx];
          let image, sujet, texte, dateElement;
          if(blogpost.titre) {
            sujet = (
              <h3 className="titre-blogpost">
                {traduire(blogpost, 'titre', this.props.language)}
              </h3>
            );
          }
          if(blogpost.texte) {
            texte = [];
            let paragraphes = traduire(blogpost, 'texte', this.props.language);
            for(let idxPara in paragraphes) {
              let paragraphe = paragraphes[idxPara];
              texte.push(<p key={idxPara}>{paragraphe}</p>)
            }
          }
          if(blogpost.modifie) {
            const dateModifiee = new Date(blogpost.modifie * 1000);
            let labelDate;
            if(dateModifiee.getFullYear() === anneeCourante) {
              labelDate = 'accueil.dateModifiee';
            } else {
              labelDate = 'accueil.dateAnneeModifiee';
            }
            dateElement = (
              <div className="date-message">
                <div className="date-modifiee">
                  <Trans values={{date: dateModifiee}}>{labelDate}</Trans>
                </div>
                <div className="heure-modifiee">
                  <Trans values={{date: dateModifiee}}>accueil.heureModifiee</Trans>
                </div>
              </div>
            )
          }
          if(blogpost.thumbnail) {
            image = (
              <img
                width={128}
                className="align-self-start mr-3"
                src={blogpost.thumbnail}
                alt={traduire(blogpost, 'titre', this.props.language)}
                />
            )
          }
          blogpostsElements.push(
            <Row key={idx} className="blogpost">
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
      } else {
        blogpostsElements = (
          <Row key={1} className="blogpost">
            <Col><Trans>blogs.aucun</Trans></Col>
          </Row>
        );
      }
    }

    return blogpostsElements;
  }
}
