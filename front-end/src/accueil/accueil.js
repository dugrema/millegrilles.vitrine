import React from 'react';
import {Jumbotron, Card, CardDeck, Button,
        Container, Row, Col} from 'react-bootstrap';

import './accueil.css';

export class AccueilVitrine extends React.Component {

  render() {
    var idmg, descriptif;
    if(this.props.configuration) {
      idmg = this.props.configuration.idmg;
      descriptif = (<p>{this.props.configuration.descriptif}</p>);
    }
    return (
      [
        <Jumbotron key='accueilHaut'>
          <Container>
            <Row>
              <Col>
                <h1>{descriptif}</h1>
                {idmg}
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
}
