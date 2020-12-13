import React from 'react'
import { Link } from "react-router-dom"
import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap'

import { useTranslation, Trans } from 'react-i18next'

import {ChampMultilingue} from '../components/ChampMultilingue'

export function Menu(props) {
  const { t, i18n } = useTranslation()

  const rootProps = props.rootProps

  var titreSite = '', changerLangue = ''
  if(rootProps.siteConfiguration) {
    if(rootProps.language && rootProps.siteConfiguration.titre) {
      titreSite = rootProps.siteConfiguration.titre[rootProps.language]
    }

    const languages = rootProps.siteConfiguration.languages
    if(languages && languages.length > 1) {
      changerLangue = <Nav.Link onClick={props.rootProps.changerLanguage}>{t('menu.changerLangue')}</Nav.Link>
    }
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/vitrine'>
        {titreSite}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems changerPage={props.changerPage} rootProps={props.rootProps}/>
        <Nav className="justify-content-end">
          {changerLangue}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export class MenuItems extends React.Component {

  changerPage = param => {

    // const params_split = param.split('/')
    // var paramsAdditionnels = {}
    // if(params_split.length > 1) {
    //   for(let idx in params_split) {
    //     if(idx === 0) continue
    //     var paramCombine = params_split[idx]
    //     var keyValue = paramCombine.split(':')
    //     paramsAdditionnels[keyValue[0]] = keyValue[1]
    //   }
    // }

    // Simuler un event avec value et dataset
    const info = {
      value: param,
      // dataset: paramsAdditionnels,
    }
    this.props.changerPage({currentTarget: info})

  }

  render() {

    const siteConfiguration = this.props.rootProps.siteConfiguration
    const language = this.props.language

    var mappingSections = ''
    if(siteConfiguration.sections) {
      mappingSections = siteConfiguration.sections.map((section, idx)=>{
        return <MenuItemSection key={idx}
                                section={section}
                                sectionIdx={idx}
                                rootProps={this.props.rootProps} />
      })
    }

    // <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.changerPage}>
    return (
      <Nav className="mr-auto">

        <Nav.Item>
          <Link to="/vitrine" className="nav-link">
            <i className="fa fa-home"/>{' '}<Trans>menu.Accueil</Trans>
          </Link>
        </Nav.Item>

        {mappingSections}

      </Nav>
    )
  }
}

function MenuItemSection(props) {
  return (
    <Nav.Item>
      <Link to={'/vitrine/section/' + props.sectionIdx} className="nav-link">
        <ChampMultilingue rootProps={props.rootProps} contenu={props.section.entete} />
      </Link>
    </Nav.Item>
  )

}
