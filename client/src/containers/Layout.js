import React from 'react'
import { Nav, Navbar, NavDropdown, Container, Row, Col} from 'react-bootstrap'
import { Trans, Translation, withTranslation } from 'react-i18next'
import QRCode from 'qrcode.react'

import { Menu, MenuItems } from './Menu'

import './Layout.css'

export class LayoutMillegrilles extends React.Component {

  componentDidMount() {
    console.debug("App props:\n%O", this.props)
  }

  render() {
    return (
      <div className="flex-wrapper">
        <div>
          <Entete changerPage={this.props.changerPage} rootProps={this.props.rootProps}/>
          <Contenu page={this.props.page}/>
        </div>
        <Footer rootProps={this.props.rootProps}/>
      </div>
    )
  }
}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} rootProps={props.rootProps}/>
      <h1>Coup D'Oeil</h1>
    </Container>
  )
}

function Contenu(props) {
  return (
    <Container>
      {props.page}
    </Container>
  )
}

function Footer(props) {

  const idmg = props.rootProps.idmg
  var qrCode = null

  if(props.rootProps.idmg) {
    qrCode = <QRCode value={'idmg:' + idmg} size={75} />;
  }

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>application.coupdoeilAdvert</Trans>{' '}
              <span title={props.rootProps.manifest.date}>
                <Trans values={{version: props.rootProps.manifest.version}}>application.coupdoeilVersion</Trans>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}
