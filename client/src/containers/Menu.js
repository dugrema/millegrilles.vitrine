import React from 'react'
import { Link } from "react-router-dom"
import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap'

import { useTranslation, Trans } from 'react-i18next'

import {ChampMultilingue} from '../components/ChampMultilingue'

export function Menu(props) {
  const { t, i18n } = useTranslation()

  const rootProps = props.rootProps,
        siteConfiguration = props.siteConfiguration || {},
        titre = siteConfiguration.titre || {},
        languages = siteConfiguration.languages || [],
        language = rootProps.language

  var titreSite = titre[language],
      changerLangue = ''

  if(languages.length > 1) {
    changerLangue = <Nav.Link onClick={props.rootProps.changerLanguage}>{t('menu.changerLangue')}</Nav.Link>
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/vitrine'>
        {titreSite}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems siteConfiguration={siteConfiguration}
                   language={language}
                   changerPage={props.changerPage} />
        <Nav className="justify-content-end">
          {changerLangue}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export function MenuItems(props) {

  const siteConfiguration = props.siteConfiguration,
        language = props.language
  const listeSections = siteConfiguration.liste_sections

  if(!listeSections) return ''

  const changerPage = param => {
    // Simuler un event avec value et dataset
    const info = {
      value: param,
    }
    props.changerPage({currentTarget: info})
  }

  var mappingSections = listeSections.map((section, idx)=>{
      return <MenuItemSection key={idx}
                              section={section}
                              sectionIdx={idx}
                              language={language} />
    })

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

function MenuItemSection(props) {
  return (
    <Nav.Item>
      <Link to={'/vitrine/section/' + props.sectionIdx} className="nav-link">
        <ChampMultilingue language={props.language} contenu={props.section.entete} />
      </Link>
    </Nav.Item>
  )

}
