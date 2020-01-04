import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

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
            dateElement = this.renderDateModifiee(blogpost.modifie);
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
              <Col lg={2}>
                {image}
                {dateElement}
              </Col>
              <Col lg={10}>
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
