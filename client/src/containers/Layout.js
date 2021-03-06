import React from 'react'
import { Container, Row, Col} from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { Menu } from './Menu'

import './Layout.css'

export class LayoutMillegrilles extends React.Component {

  componentDidMount() {
    // console.debug("App props:\n%O", this.props)
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
      <div className="body-top-padding"></div>
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
    // qrCode = <QRCode value={'idmg:' + idmg} size={75} />;
  }

  var manifest = ''
  if(props.rootProps && props.rootProps.manifest) {
    manifest = props.rootProps.manifest
  }

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>layout.coupdoeilAdvert</Trans>{' '}
              <span title={manifest.date}>
                <Trans values={{version: manifest.version}}>layout.coupdoeilVersion</Trans>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}
