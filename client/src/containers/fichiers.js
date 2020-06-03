import React from 'react';
import {SectionVitrine, CollectionVitrine} from './sections';
import {Container, Row, Col, Button, ListGroup} from 'react-bootstrap';
import {pathConsignation} from '../components/pathUtils';

import { Trans } from 'react-i18next';
import { traduire } from '../components/langutils.js';

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

    let contenu;
    if(this.state.uuidCollectionCourante) {
      contenu = (
        <AfficherCollection
          renderDateModifiee={this.renderDateModifiee}
          retourPrincipale={this._retourPrincipale}
          {...this.props}
          {...this.state}
        />
      )
    } else {
      let fichiers = null;
      if(this.state.contenu) {
        fichiers = this.state.contenu.top
      }

      contenu = (
        <div>
          <Row className="page-header">
            <Col>
              <h2><Trans>fichiers.titrePage</Trans></h2>
              <hr/>
            </Col>
          </Row>

          <RenderFichiers
            fichiers={fichiers}
            renderDateModifiee={this.renderDateModifiee}
            {...this.props}
            {...this.state} />
          {this._renderCollections()}
        </div>
      )
    }

    return (
      <Container>
        {contenu}
      </Container>
    );
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
              <Button variant="link" onClick={this._selectionnerCollection} value={collection.uuid_collection_figee}>
                <h3 className="nom-collection">
                  {traduire(collection, 'nom', this.props.language)}
                </h3>
              </Button>
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
            <ListGroup.Item key={collection.uuid}>
              {sujet}
              {texte}
            </ListGroup.Item>
          );
        });

      }
    }

    let resultat;
    if(!collectionsElements) {
      resultat = (
        <Row key={2} className="message">
          <Col><Trans>fichiers.aucuneCollection</Trans></Col>
        </Row>
      );
    } else {
      resultat = (
        <ListGroup variant="flush">
          {collectionsElements}
        </ListGroup>
      )
    }

    return resultat;
  }

  _selectionnerCollection = event => {
    let uuidCollectionCourante = event.currentTarget.value;
    console.debug(uuidCollectionCourante)
    this.setState({uuidCollectionCourante});
  }

  _retourPrincipale = event => {
    this.setState({uuidCollectionCourante: null});
  }

}

class AfficherCollection extends CollectionVitrine {

  getUuid() {
    return this.props.uuidCollectionCourante;
  }

  render() {
    var nom, fichiers;
    if(this.state.contenu) {
      nom = this.state.contenu.nom;
      fichiers = this.state.contenu.documents;
    }
    return (
      <div>
        <Row className="page-header">
          <Col>
            <h2><Trans values={{nom}}>fichiers.collectionTitre</Trans></h2>
            <hr/>
          </Col>
        </Row>

        <Button onClick={this.props.retourPrincipale}>Back</Button>

        <RenderFichiers
          fichiers={fichiers}
          {...this.props} />
      </div>
    )
  }

}

function RenderFichiers(props) {
  var fichiersElements;

  if(props.fichiers) {
    const fichiers = props.fichiers;

    // console.debug("Fichiers");
    // console.debug(fichiers);

    if(fichiers && Object.values(fichiers).length > 0) {
      fichiersElements = [];

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
          const nomFichier = traduire(fichier, 'nom', props.language);

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
            fuuid, {extension}, props.configuration.consignation);
          nom = (
            <Button variant="link" href={pathFichier} download={nomFichier}>
              <h3 className="nom-fichier">
                {nomFichier}
              </h3>
            </Button>
          );
        }
        if(fichier.commentaires) {
          texte = (
            <p className="texte-fichier">
              {traduire(fichier, 'commentaires', props.language)}
            </p>
          );
        }
        if(fichier.date_version) {
          dateElement = props.renderDateModifiee(fichier.date_version);
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
