import React from 'react';
import { Trans } from 'react-i18next';
import { Route, Switch, Status } from 'react-router-dom';
import {Container, Row, Col} from 'react-bootstrap';

import { AccueilVitrine } from './accueil';
import { AlbumsVitrine } from './albums';
import { MessagesVitrine } from './messages';
import { BlogsVitrine } from './blogs';
import { PodcastsVitrine } from './podcasts';
import { FichiersVitrine } from './fichiers';
import { SenseursPassifsVitrine } from './senseursPassifs';

// La liste des sections supportees est limite a ce qui est charge dans ce fichier
const sections = {
  SenseursPassifs: SenseursPassifsVitrine,
}

// Cette fonction effecute le mapping pour le menu de Vitrine
export function getElementSection(section) {
  return sections[section];
}

export function listerSections() {
  return Object.keys(sections);
}

export class AfficherSection extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={AccueilVitrine}/>
        <Route path="/albums"  component={AlbumsVitrine}/>
        <Route path="/messages" component={MessagesVitrine}/>
        <Route path="/blogs" component={BlogsVitrine}/>
        <Route path="/podcasts" component={PodcastsVitrine}/>
        <Route path="/fichiers" component={FichiersVitrine}/>
        <Route path="/files" component={FichiersVitrine}/>
        <Route path="/senseursPassifs" component={SenseursPassifsVitrine}/>
        <Route render={() => {
          return (<NotFound/>);
        }}/>
      </Switch>
    );
  }
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
