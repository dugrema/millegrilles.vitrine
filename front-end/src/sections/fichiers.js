import React from 'react';
import {SectionVitrine} from './sections';
import {Container, Row, Col} from 'react-bootstrap';
import {pathConsignation} from '../pathUtils';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';

import './fichiers.css';

const NOM_SECTION = 'fichiers';
const FICHIERS_LIBELLE = 'page.' + NOM_SECTION, FICHIERS_URL = NOM_SECTION + '.json';

export class FichiersVitrine extends SectionVitrine {

  getNomSection() {
    return NOM_SECTION;
  }

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

    if(this.state.contenu && this.state.contenu.top) {
      const fichiers = this.state.contenu.top;

      // console.debug("Fichiers");
      // console.debug(fichiers);

      if(fichiers && Object.values(fichiers).length > 0) {
        fichiersElements = [];

        // Ajouter entete pour les fichiers recents
        fichiersElements.push(
          <Row key={1}>
            <Col>
              <h4><Trans>fichiers.top</Trans></h4>
            </Col>
          </Row>
        )

        // Trier les fichiers par date descendante et afficher
        new Array().concat(Object.values(fichiers))
        .sort((a,b) => {
          if(a.date_version === b.date_version) return 0;
          if(!a.date_version) return 1;
          if(!b.date_version) return -1;
          return b.date_version - a.date_version
        })
        .forEach(fichier=>{
          let nom, texte, dateElement;
          if(fichier.nom) {
            const nomFichier = traduire(fichier, 'nom', this.props.language);

            // Exception pour les videos, on prend le 480p
            let fuuid, extension;
            if(fichier.fuuidVideo480p) {
              fuuid = fichier.fuuidVideo480p;
              extension = 'mp4';
            } else{
              fuuid = fichier.fuuid;
              extension = fichier.extension;
            }

            var pathFichier = pathConsignation(
              fuuid, {extension}, this.props.configuration.consignation);
            nom = (
              <h3 className="nom-fichier">
                <a href={pathFichier} download={nomFichier}>
                  {nomFichier}
                </a>
              </h3>
            );
          }
          if(fichier.commentaires) {
            texte = (
              <p className="texte-fichier">
                {traduire(fichier, 'commentaires', this.props.language)}
              </p>
            );
          }
          if(fichier.date_version) {
            dateElement = this.renderDateModifiee(fichier.date_version);
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
        })
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
      var collections = this.state.contenu.collections;

      var collectionsModifiees = [];
      for(let uuid_collection in this.state.contenu.collections) {
        let collection = Object.assign({}, this.state.contenu.collections[uuid_collection]);  // Cloner
        collection['uuid_collection_figee'] = uuid_collection;
        collectionsModifiees.push(collection);
      }

      // Trier nouvelle collection
      collectionsModifiees.sort((a,b)=>{
        return a.nom.localeCompare(b.nom)
      })

      // console.debug("Collections")
      // console.debug(collectionsModifiees)

      if(collectionsModifiees.length > 0) {
        collectionsElements = [];

        // Ajouter entete pour les fichiers recents
        collectionsElements.push(
          <Row key={2}>
            <Col>
              <h4><Trans>fichiers.collections</Trans></h4>
            </Col>
          </Row>
        )

        collectionsModifiees.forEach(collection => {
          let sujet, texte, dateElement;
          if(collection.nom) {
            sujet = (
              <h3 className="nom-collection">
                {traduire(collection, 'nom', this.props.language)}
              </h3>
            );
          }
          if(collection.commentaires) {
            texte = (
              <p className="texte-collection">
                {traduire(collection, 'commentaires', this.props.language)}
              </p>
            );
          }
          collectionsElements.push(
            <Row key={collection.uuid} className="collection">
              <Col sm={12}>
                {sujet}
                {texte}
              </Col>
            </Row>
          );
        });

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
