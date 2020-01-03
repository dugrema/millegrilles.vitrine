import React from 'react';
import { Trans } from 'react-i18next';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { AccueilVitrine } from './accueil';
import { AlbumsVitrine } from './albums';
import { MessagesVitrine } from './messages';
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
    const language = this.props.language;
    return (
      <Switch>
        <Route exact path="/">
          <AccueilVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route path="/albums">
          <AlbumsVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route path="/messages">
          <MessagesVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route path="/podcasts">
          <PodcastsVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route path="/fichiers">
          <FichiersVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route path="/files">
          <FichiersVitrine
            language={language}
            configuration={this.props.configuration}
            />
        </Route>
        <Route render={() => <h1><Trans>application.pageNonTrouvee</Trans></h1>} />
      </Switch>
    );
  }
}
