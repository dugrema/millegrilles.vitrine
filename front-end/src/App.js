import React, {PureComponent} from 'react';
import {Jumbotron, Card, CardDeck, Button, Nav, Navbar,
        Container, Row, Col} from 'react-bootstrap';
import './w3.css';  // Copie de https://www.w3schools.com/w3css/4/w3.css
import './App.css';

import {SenseursPassifsVitrine} from './domaines/SenseursPassifs';

class App extends React.Component {

  state = {
    domaine: '',
  }

  webSocketHandler = null;

  domaines = {
    '': Accueil,
    SenseursPassifs: SenseursPassifsVitrine,
  }

  menuActions = {
    afficherAccueil: event => {
      this.setState({domaine: null});
    },
    changerDomaine: domaine => {
      this.setState({domaine: domaine});
    }
  }

  componentDidMount() {
  }

  render() {

    let content;
    if(this.state.domaine && this.state.domaine != '') {
      const DomaineElement = this.domaines[this.state.domaine];
      content = (<DomaineElement key="domaine" />);
    } else {
      content = (<Accueil/>);
    }

    return (
        <div className="App">
          <ToggleMenu
            menuActions={this.menuActions}
            domaine={this.state.domaine} />
          {content}
        </div>
    );
  }

}

function Accueil(props) {
  return (
    [
      <Jumbotron>
        <Container>
          <Row>
            <Col>
              <h1>MilleGrille XXXX</h1>
              <p>
                Vitrine sur MilleGrilles.
              </p>
              <p>Choisir une option dans le menu pour poursuivre.</p>
            </Col>
            <Col>
              <i className="fa fa-clone fa-5x w3-padding-64 w3-text-red"></i>
            </Col>
          </Row>
        </Container>
      </Jumbotron>,
      <CardDeck>
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

class ToggleMenu extends PureComponent {

  state = {
    show: false,
  }

  toggleMenu = event => {
    this.setState({show: !this.state.show});
  }

  afficherAccueil = event => {
    this.setState({show: false});
    this.props.menuActions.afficherAccueil(event);
  }

  changerDomaine = event => {
    this.setState({show: false});
    let domaine;
    if(event.currentTarget) {
      domaine = event.currentTarget.value;
    } else {
      domaine = event;
    }
    this.props.menuActions.changerDomaine(domaine);

  }

  render() {
    let mobileMenu;
    if(this.state.show) {
      mobileMenu = (
        <div id="navDemo" className="w3-bar-block w3-white w3-hide w3-hide-large w3-hide-medium w3-large w3-show">
          <a href='/' className="w3-bar-item w3-button w3-padding-large">Accueil</a>
          <button className="w3-bar-item w3-button w3-padding-large"
            onClick={this.changerDomaine} value="vitrine">Vitrine</button>
          <button className="w3-bar-item w3-button w3-padding-large"
            onClick={this.changerDomaine} value="SenseursPassifs">Senseurs Passifs</button>
        </div>
      );
    } else {
      mobileMenu = null;
    }

    let items = {'SenseursPassifs': 'Senseurs Passifs'};
    let boutons = [];
    for(var domaine in items) {
      let domaineDesc = items[domaine];
      let className = 'w3-bar-item w3-button w3-padding-large';
      if(this.props.domaine === domaine) {
        className += ' w3-white';
      } else {
        className += ' w3-hide-small w3-hover-white';
      }
      boutons.push(
        <Nav.Link key={domaine} eventKey={domaine}>{domaineDesc}</Nav.Link>
      );
    }

    let content = (
      <Navbar collapseOnSelect expand="md" bg="dark" variant="dark" fixed="top" onSelect={this.changerDomaine}>
        <Navbar.Brand href='#' onClick={this.changerDomaine}>Vitrine</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
            {boutons}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );

    return content;
  }
}

export default App;
