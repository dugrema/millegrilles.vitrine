import React, {useState, useEffect} from 'react'
import {Switch, Route} from 'react-router'
import {useParams} from 'react-router-dom'
import {Alert} from 'react-bootstrap'

const SectionPage = React.lazy(_=>import('./SectionPage'))
const SectionFichiers = React.lazy(_=>import('./SectionFichiers'))
const SectionAlbum = React.lazy(_=>import('./SectionAlbum'))

export default function ContenuSite(props) {

  if(!props.siteConfiguration) return ''

  return (
    <Switch>
      <Route path="/vitrine/section/:sectionIdx">
        <Section {...props} />
      </Route>
      <Route>
        <Accueil {...props} />
      </Route>
    </Switch>
  )

}

function Accueil(props) {
  // L'accueil est la premiere section dans la liste
  const section = props.siteConfiguration.liste_sections[0]

  if(section.accueil === true) {
    <RenderSection section={section}
                   {...props} />
  } else {
    return (
      <p>Accueil vide</p>
    )
  }
}

function Section(props) {
  const {sectionIdx} = useParams()

  const section = props.siteConfiguration.liste_sections[sectionIdx]

  return (
    <RenderSection section={section}
                   {...props} />
  )
}

function RenderSection(props) {

  const typeSection = props.section.type_section
  var ElemSection = TypeSectionInconnue
  switch(typeSection) {
    case 'fichiers': ElemSection = SectionFichiers; break
    case 'albums': ElemSection = SectionAlbum; break
    case 'pages': ElemSection = SectionPage; break
    // case 'forums': ElemSection = SectionForums; break
    default:
      ElemSection = TypeSectionInconnue
  }

  console.debug("!!! RenderSection proppys : %O", props)

  return (
    <ElemSection {...props} />
  )
}

function TypeSectionInconnue(props) {
  return (
    <Alert variant="warning">
      Type de section inconnue
    </Alert>
  )
}
