import React from 'react'
import {Jumbotron, Row, Col} from 'react-bootstrap'

import {ChampMultilingue} from '../components/ChampMultilingue'
import {Post} from './Posts'
import {CardDeckMapping} from './CardLayouts'

export class SiteAccueil extends React.Component {
  render() {
    const rootProps = this.props.rootProps
    const siteConfiguration = rootProps.siteConfiguration

    const rangees = siteConfiguration.accueil.map((rangee, idx)=>{
      return <RangeeAccueil key={idx} rootProps={rootProps} rangee={rangee} />
    })

    return rangees
  }
}

function RangeeAccueil(props) {
  // Determine le type de rangee, charge le component approprie
  const rangee = props.rangee
  if(rangee.layout === 'CardDeck') {
    return <CardDeckMapping rootProps={props.rootProps} {...props.rangee} />
  } else if(rangee.post_id) {
    return <Post rootProps={props.rootProps} {...props.rangee} />
  }
}
