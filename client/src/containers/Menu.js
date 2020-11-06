import React from 'react'
import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap';

import { Trans } from 'react-i18next';

export function Menu(props) {

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems changerPage={props.changerPage} rootProps={props.rootProps}/>
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export class MenuItems extends React.Component {

  changerPage = param => {

    const params_split = param.split('/')
    var paramsAdditionnels = {}
    if(params_split.length > 1) {
      for(let idx in params_split) {
        if(idx === 0) continue
        var paramCombine = params_split[idx]
        var keyValue = paramCombine.split(':')
        paramsAdditionnels[keyValue[0]] = keyValue[1]
      }
    }

    // Simuler un event avec value et dataset
    const info = {
      value: params_split[0],
      dataset: paramsAdditionnels,
    }
    this.props.changerPage({currentTarget: info})

  }

  render() {

    return (
      <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.changerPage}>

        <Nav.Item>
          <Nav.Link eventKey='Accueil'>
            <Trans>menu.Accueil</Trans>
          </Nav.Link>
        </Nav.Item>

        <Dropdown as={NavItem}>
          <Dropdown.Toggle as={NavLink}><Trans>menu.Favoris</Trans></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="GererFavoris"><Trans>menu.GererFavoris</Trans></Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

      </Nav>
    )
  }
}
