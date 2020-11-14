import React from 'react'
import {Jumbotron, Row, Col} from 'react-bootstrap'

import {ChampMultilingue} from '../components/ChampMultilingue'

export class SiteAccueil extends React.Component {
  render() {
    const rootProps = this.props.rootProps
    const siteConfiguration = rootProps.siteConfiguration

    return (
      <>
        <Jumbotron>
          <h1><ChampMultilingue contenu={siteConfiguration.titre} rootProps={rootProps} /></h1>
        </Jumbotron>

      </>
    )
  }
}
