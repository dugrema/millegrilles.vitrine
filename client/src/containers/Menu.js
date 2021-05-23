import React, {useState} from 'react'
import { Link } from "react-router-dom"
import { Nav, Navbar } from 'react-bootstrap'

import { useTranslation, Trans } from 'react-i18next'

import {ChampMultilingue} from '../components/ChampMultilingue'

export function Menu(props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const siteConfiguration = props.siteConfiguration || {},
        titre = siteConfiguration.titre || {},
        languages = siteConfiguration.languages || [],
        language = props.language

  var titreSite = titre[language],
      changerLangue = ''

  const languesDisponibles = languages.filter(item=>item!==language)
  if(languesDisponibles.length === 1) {
    const fctChangerLangue = _ => {props.changerLangue(languesDisponibles[0])}
    changerLangue = <Nav.Link onClick={fctChangerLangue}>{t('menu.changerLangue')}</Nav.Link>
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top" expanded={expanded} onToggle={setExpanded}>
      <Navbar.Brand href='/vitrine'>
        {titreSite}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems siteConfiguration={siteConfiguration}
                   language={language}
                   changerPage={props.changerPage}
                   setExpanded={setExpanded} />
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

  var mappingSections = listeSections.map((section, idx)=>{
      return <MenuItemSection key={idx}
                              section={section}
                              sectionIdx={idx}
                              language={language}
                              setExpanded={props.setExpanded} />
    })

    // <Nav.Item>
    //   <Link to="./" className="nav-link" onClick={_=>{props.setExpanded(false)}}>
    //     <i className="fa fa-home"/>{' '}<Trans>menu.Accueil</Trans>
    //   </Link>
    // </Nav.Item>

  return (
    <Nav className="mr-auto">

      {mappingSections}

    </Nav>
  )
}

function MenuItemSection(props) {
  return (
    <Nav.Item>
      <Link to={'/vitrine/section/' + props.sectionIdx} className="nav-link" onClick={_=>{props.setExpanded(false)}}>
        <ChampMultilingue language={props.language} contenu={props.section.entete} />
      </Link>
    </Nav.Item>
  )

}
