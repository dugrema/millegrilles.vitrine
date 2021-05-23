import React from 'react'
import { Container, Row, Col} from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { Menu } from './Menu'

import './Layout.css'

export function LayoutMillegrilles(props) {

  return (
    <>
      <Entete siteConfiguration={props.siteConfiguration}
              language={props.language}
              changerPage={props.changerPage}
              changerLangue={props.changerLangue} />

      <div className="flex-wrapper">
        <div className="contenu">
          <Container>
            {props.children}
          </Container>
        </div>
        <Footer {...props} />
      </div>

    </>
  )

}

function Entete(props) {
  return (
    <Container className="entete">
      <Menu {...props} />
      <div className="body-top-padding"></div>
    </Container>
  )
}

function Footer(props) {

  const siteConfiguration = props.siteConfiguration || {},
        entete = siteConfiguration['en-tete'] || {},
        idmg = entete.idmg,
        manifest = props.manifest || {}

  var qrCode = null

  if(idmg) {
    // qrCode = <QRCode value={'idmg:' + idmg} size={75} />;
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
