import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';

import './fichiers.css';

const FICHIERS_LIBELLE = 'page.fichiers', FICHIERS_URL = 'fichiers.json';

export class FichiersVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return FICHIERS_LIBELLE;
  }

  getDocumentUrl() {
    return FICHIERS_URL;
  }

  render() {
    return (
      <Container>
        <Row className="page-header">
          <Col>
            <h2><Trans>fichiers.titrePage</Trans></h2>
            <hr/>
          </Col>
        </Row>
        {this._renderFichiersRecents()}
        {this._renderCollections()}
      </Container>
    );
  }

  _renderFichiersRecents() {
    var fichiersElements;

    if(this.state.contenu && this.state.contenu.recents) {
      const fichiers = this.state.contenu.recents;
      if(fichiers && fichiers.length > 0) {
        fichiersElements = [];

        // Ajouter entete pour les fichiers recents
        fichiersElements.push(
          <Row key={1}>
            <Col>
              <h4><Trans>fichiers.recents</Trans></h4>
            </Col>
          </Row>
        )

        for(let idx in fichiers) {
          let fichier = fichiers[idx];
          let nom, texte, dateElement;
          if(fichier.nom) {
            nom = (
              <h3 className="nom-fichier">
                {traduire(fichier, 'nom', this.props.language)}
              </h3>
            );
          }
          if(fichier.texte) {
            texte = (
              <p className="texte-fichier">
                {traduire(fichier, 'texte', this.props.language)}
              </p>
            );
          }
          if(fichier.modifie) {
            dateElement = this.renderDateModifiee(fichier.modifie);
          }
          fichiersElements.push(
            <Row key={fichier.fuuid} className="fichier">
              <Col sm={2}>
                {dateElement}
              </Col>
              <Col sm={10}>
                {nom}
                {texte}
              </Col>
            </Row>
          );
        }
      }
    }

    if(!fichiersElements) {
      fichiersElements = (
        <Row key={1} className="message">
          <Col><Trans>fichiers.aucun</Trans></Col>
        </Row>
      );
    }

    return fichiersElements;
  }

  _renderCollections() {
    var collectionsElements;

    if(this.state.contenu && this.state.contenu.collections) {
      const collections = this.state.contenu.collections;
      if(collections && collections.length > 0) {
        collectionsElements = [];

        // Ajouter entete pour les fichiers recents
        collectionsElements.push(
          <Row key={2}>
            <Col>
              <h4><Trans>fichiers.collections</Trans></h4>
            </Col>
          </Row>
        )

        for(let idx in collections) {
          let collection = collections[idx];
          let sujet, texte, dateElement;
          if(collection.nom) {
            sujet = (
              <h3 className="nom-collection">
                {traduire(collection, 'nom', this.props.language)}
              </h3>
            );
          }
          if(collection.description) {
            texte = (
              <p className="texte-collection">
                {traduire(collection, 'description', this.props.language)}
              </p>
            );
          }
          if(collection.modifie) {
            dateElement = this.renderDateModifiee(collection.modifie);
          }
          collectionsElements.push(
            <Row key={collection.uuid} className="collection">
              <Col sm={2}>
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

    if(!collectionsElements) {
      collectionsElements = (
        <Row key={2} className="message">
          <Col><Trans>fichiers.aucuneCollection</Trans></Col>
        </Row>
      );
    }

    return collectionsElements;
  }
}
