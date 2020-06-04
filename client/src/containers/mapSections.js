import React from 'react';
import { Trans } from 'react-i18next';
import { Route, Switch } from 'react-router-dom';
import {Container, Row, Col} from 'react-bootstrap';

import { AccueilVitrine } from './accueil';
// import { AlbumsVitrine } from './albums';
import { AnnoncesVitrine } from './annonces';
import { BlogsVitrine } from './blogs';
// import { PodcastsVitrine } from './podcasts';
// import { FichiersVitrine } from './fichiers';
// import { SenseursPassifsVitrine } from './senseursPassifs';

// La liste des sections supportees est limite a ce qui est charge dans ce fichier
const sections = {
  AccueilVitrine, AnnoncesVitrine, BlogsVitrine
}

export default function AfficherSection(props) {

  const nomPage = props.rootProps.page
  var Page = sections[nomPage]
  if(!Page) {
    Page = (<NotFound />)
  }

  return (
    <Page rootProps={props.rootProps} />
  )
}

function NotFound(props) {
  return (
    <Container>
      <Row className="page-header">
        <Col>
          <h2><Trans>application.pageNonTrouvee</Trans></h2>
          <hr/>
        </Col>
      </Row>
    </Container>
  )
}
