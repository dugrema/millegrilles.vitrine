import React, {PureComponent} from 'react';
import {Jumbotron, Card, Container, Row, Col} from 'react-bootstrap';
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
    changerDomaine: event => {
      this.setState({domaine: event.currentTarget.value});
    }
  }

  componentDidMount() {
  }

  render() {

    let content;
    if(this.state.domaine && this.state.domaine != '') {
      const DomaineElement = this.domaines[this.state.domaine];
      let header = (
        <header className="App-header w3-container w3-red w3-center">
          <p className="w3-xlarge">MilleGrille XXXXA</p>
        </header>
      );

      content = (
        [
          header,
          <DomaineElement />
        ]
      );
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
    </Jumbotron>
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
    this.props.menuActions.changerDomaine(event);
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

    let items = {'': 'Accueil', 'SenseursPassifs': 'Senseurs Passifs'};
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
        <button key={domaine}
          className={className}
          onClick={this.changerDomaine} value={domaine}>{domaineDesc}</button>
      );
    }

    let content = (
      <nav className="w3-top">
        <div className="w3-bar w3-red w3-card w3-left-align w3-large">
          <button
            className="w3-bar-item w3-button w3-hide-medium w3-hide-large w3-right w3-padding-large w3-hover-white w3-large w3-red"
            onClick={this.toggleMenu}
            title="Toggle Navigation Menu">
              <i className="fa fa-bars"></i>
          </button>
          {boutons}
        </div>

        {mobileMenu}
      </nav>
    );

    return content;
  }
}

export default App;
