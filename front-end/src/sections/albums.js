import React from 'react';
import {Card, CardColumns} from 'react-bootstrap';
import {SectionVitrine} from './sections';

import './albums.css';

const ALBUMS_LIBELLE = 'page.albums', ALBUMS_URL = '/albums.json';

export class AlbumsVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return ALBUMS_LIBELLE;
  }

  getDocumentUrl() {
    return ALBUMS_URL;
  }

  render() {
    return (
      <div>
        {this._renderRecent()}
        {this._renderCollections()}
      </div>
    );
  }

  _renderRecent() {
    return (
      <CardColumns>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card>
          <Card.Img variant="top" src="res/guido-hofmann-G7BDFhrV00E-unsplash.jpg" />
          <Card.Body>
            <Card.Title>Card title that wraps to a new line</Card.Title>
            <Card.Text>
              This is a longer card with supporting text below as a natural lead-in to
              additional content. This content is a little bit longer.
            </Card.Text>
          </Card.Body>
        </Card>
      </CardColumns>
    )
  }

  _renderCollections() {

    const collectionsListe = [];
    if(this.state.contenu && this.state.contenu.contenuPage) {
      const collections = this.state.contenu.contenuPage.collections;
      for(let idx in collections) {
        let collection = collections[idx];
        var legende;

        if(collection.descriptif) {
          legende = (
            <Card.Body>
              <Card.Text>{collection.descriptif}</Card.Text>
            </Card.Body>
          );
        }

        collectionsListe.push(
          <Card key={idx}>
            <Card.Img variant="top" src={collection.thumbnail} />
            {legende}
          </Card>
        );
      }
    }

    return (
      <CardColumns>
        {collectionsListe}
      </CardColumns>
    );
  }
}
