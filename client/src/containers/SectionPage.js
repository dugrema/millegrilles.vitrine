import React, {useState, useEffect} from 'react'
import parse from 'html-react-parser'

import {ChampMultilingue, ChampHtmlMultilingue} from '../components/ChampMultilingue'

export default function SectionPage(props) {
  console.debug("!!!! PROPPYS %O", props)
  const section = props.section,
        resolver = props.workers.resolver,
        sectionId = section.section_id

  const [contenuSection, setContenuSection] = useState('')
  useEffect(_ =>{
    chargerSection(resolver, sectionId, setContenuSection)
  }, [])

  const partiesPages = contenuSection.parties_pages,
        entete = section.entete

  return (
    <>
      <h2>
        <ChampMultilingue language={props.language} contenu={entete} />
      </h2>
      <AfficherPartiesPages partiesPages={partiesPages}
                            language={props.language}
                            resolver={resolver} />
    </>
  )
}

function AfficherPartiesPages(props) {
  if(!props.partiesPages) return ''

  return props.partiesPages.map((item, idx)=>{

    var AfficherPartie = TypeInconnu

    switch(item.type_partie) {
      case 'texte': AfficherPartie = TypeTexte; break
      case 'media': AfficherPartie = TypeMedia; break
      case 'colonnes': AfficherPartie = TypeColonnes; break
      default:
    }

    return (
      <div key={idx}>
        <AfficherPartie partiePage={item}
                        {...props} />
      </div>
    )
  })
}

function TypeTexte(props) {
  return <ChampHtmlMultilingue language={props.language}
                               contenu={props.partiePage.html} />
}

function TypeMedia(props) {
  return <p>Type media</p>
}

function TypeColonnes(props) {
  return <p>Type colonne</p>
}

function TypeInconnu(props) {
  return (
    <p>Partie de type inconnu</p>
  )
}

async function chargerSection(resolver, sectionId, setContenuSection) {
  const {data} = await resolver.getSection(sectionId, 'pages')
  console.debug("!!! contenu section recu : %O", data)
  setContenuSection(data)
}
