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
  const section = props.section,
        typeSection = section.type_section,
        resolver = props.workers.resolver

  // const [contenuSection, setContenuSection] = useState('')
  // useEffect(_=>{chargerSection(resolver, section, setContenuSection)}, [])

  // console.debug("Contenu section chargee : %O", contenuSection)

  var ElemSection = TypeSectionInconnue
  switch(typeSection) {
    case 'fichiers': ElemSection = SectionFichiers; break
    case 'album': ElemSection = SectionAlbum; break
    case 'pages': ElemSection = SectionPage; break
    // case 'forums': ElemSection = SectionForums; break
    default:
      ElemSection = TypeSectionInconnue
  }

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

// async function chargerSection(resolver, section, setContenuSection) {
//   const sectionId = section.section_id,
//         typeSection = section.type_section
//   const {data} = await resolver.getSection(sectionId, typeSection)
//   console.debug("Charger section - data : %O", data)
//   setContenuSection(data)
// }
