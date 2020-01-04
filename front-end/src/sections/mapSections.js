import React from 'react';
import { Trans } from 'react-i18next';
import { Route, Switch } from 'react-router-dom';

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
        <Route exact path="/">
          <AccueilVitrine {...this.props}/>
        </Route>
        <Route path="/albums">
          <AlbumsVitrine {...this.props}/>
        </Route>
        <Route path="/messages">
          <MessagesVitrine {...this.props}/>
        </Route>
        <Route path="/blogs">
          <BlogsVitrine {...this.props}/>
        </Route>
        <Route path="/podcasts">
          <PodcastsVitrine {...this.props}/>
        </Route>
        <Route path="/fichiers">
          <FichiersVitrine {...this.props}/>
        </Route>
        <Route path="/files">
          <FichiersVitrine {...this.props}/>
        </Route>
        <Route render={() => <h1><Trans>application.pageNonTrouvee</Trans></h1>} />
      </Switch>
    );
  }
}
