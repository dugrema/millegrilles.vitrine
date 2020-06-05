import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../components/langutils.js';
import './blogs.css';

const NOM_SECTION = 'blogs';
const CONFIGURATION_DOCUMENTS = {
  'blogs': {pathFichier: '/blogs/blogs.json'},
}

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class BlogsVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION
  }

  getConfigDocuments() {
    return CONFIGURATION_DOCUMENTS
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

    if(this.state.blogs) {
      const blogsResultats = this.state.blogs.resultats
      const blogposts = Object.values(blogsResultats)
      // console.debug("Blogposts")
      // console.debug(blogposts);
      if(blogposts && blogposts.length > 0) {
        blogpostsElements = blogposts
        .sort(blogpostSortParPublicationDesc)
        .map((blogpost, idx) => {
          let image = null, sujet = null, texte = null, dateElement = null;

          if(blogpost.titre) {
            sujet = (
              <h3 className="titre-blogpost">
                {traduire(blogpost, 'titre', this.props.language, this.props.milleGrille)}
              </h3>
            );
          }
          if(blogpost.texte) {
            texte = [];
            const texteTraduit = traduire(blogpost, 'texte', this.props.language, this.props.milleGrille);
            const paragraphes = texteTraduit.split('\n\n');
            paragraphes.forEach( (p, idxPara) => {
              let paragraphe = paragraphes[idxPara];
              texte.push(<p key={idxPara}>{paragraphe}</p>)
            });
          }
          if(blogpost.datePublication) {
            // dateElement = this.renderDateModifiee(blogpost.datePublication);
            dateElement = blogpost.datePublication
          }
          if(blogpost.image) {
            image = (
              <img
                width={128}
                className="align-self-start mr-3"
                src={PREFIX_DATA_URL + blogpost.image.thumbnail}
                alt={traduire(blogpost, 'titre', this.props.language, this.props.milleGrille)}
                />
            )
          }

          return(
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

        });

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

function blogpostSortParPublicationDesc(a, b) {
  const aDate = a.datePublication, bDate = b.datePublication;

  if(aDate === bDate) return 0;
  if(!aDate) return 1;
  if(!bDate) return -1;
  return bDate - aDate;
}
