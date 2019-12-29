import React from 'react';
import {Jumbotron, Card, CardDeck, Button,
        Container, Row, Col} from 'react-bootstrap';
import axios from 'axios';

import './accueil.css';

const ACCUEIL_LIBELLE = 'page.accueil', ACCUEIL_URL = '/accueil.json';

export class AccueilVitrine extends React.Component {

  state = {
    contenu: null,
  }

  componentDidMount() {
    this._chargerPage(ACCUEIL_LIBELLE, ACCUEIL_URL);
  }

  render() {
    var idmg, descriptif, messageBienvenue;
    if(this.props.configuration) {
      idmg = this.props.configuration.contenuPage.idmg;
      descriptif = (<p>{this.props.configuration.contenuPage.descriptif}</p>);
    }
    if(this.state.contenu && this.state.contenu.contenuPage.messageBienvenue) {
      messageBienvenue = (<p>{this.state.contenu.contenuPage.messageBienvenue}</p>);
    }
    return (
      [
        <Jumbotron key='accueilHaut'>
          <Container>
            <Row>
              <Col>
                <h1>{descriptif}</h1>
                {idmg}
                {messageBienvenue}
              </Col>
              <Col>
                <i className="fa fa-clone fa-5x w3-padding-64 w3-text-red"></i>
              </Col>
            </Row>
          </Container>
        </Jumbotron>,
        <CardDeck key='accueilBas'>
          <Card>
            <Card.Img variant="top" src="/logo512.png" />
            <Card.Body>
              <Card.Title>Card Title</Card.Title>
              <Card.Text>
                Some quick example text to build on the card title and make up the bulk of
                the card's content.
              </Card.Text>
              <Button variant="primary">Go somewhere</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Card.Title>Card Title</Card.Title>
              <Card.Text>
                Some quick example text to build on the card title and make up the bulk of
                the card's content.
              </Card.Text>
              <Button variant="primary">Go somewhere</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Card.Title>Card Title</Card.Title>
              <Card.Text>
                Some quick example text to build on the card title and make up the bulk of
                the card's content.
              </Card.Text>
              <Button variant="primary">Go somewhere</Button>
            </Card.Body>
          </Card>
        </CardDeck>
      ]
    );
  }

  // Charge le fichier json qui s'occupe du contenu de cette page
  // libelle: Nom dans localStorage (e.g. page.accueil)
  // url: URL relatif sur le serveur (e.g. /defaut/accueil.json)
  _chargerPage(libelle, url) {
    let contenuPageStr = localStorage.getItem(libelle);

    const headers = {};
    if(contenuPageStr) {
      const contenu = JSON.parse(contenuPageStr);
      this.setState({contenu});

      let lastModified = contenu.lastModified;
      if(lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
    }

    // Tenter de charger une version mise a jour a partir du serveur
    axios.get('/defauts' + url, {
      headers,
      validateStatus: status=>{return status === 200 || status === 304}
    })
    .then(resp=>{
      console.debug(resp);
      if(resp.status === 200) {
        // Sauvegarder le contenu mis a jour localement
        const contenuPage = resp.data;
        const contenu = {
          contenuPage,
          lastModified: resp.headers['last-modified'],
        }
        this.setState({contenu});
        localStorage.setItem(libelle, JSON.stringify(contenu));
      }
    })
    .catch(err=>{
      console.error("Erreur acces page " + libelle);
      console.error(err);
    })

  }
}
