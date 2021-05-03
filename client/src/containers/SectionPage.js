import React, {useState, useEffect} from 'react'
import parse from 'html-react-parser'
import { Card, CardDeck } from 'react-bootstrap'

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
  console.debug("!!! TypeColonnes %O", props)
  return (
    <CardDeck>
      {props.partiePage.colonnes.map((item, idx)=>{
        return (
          <PageColonneAffichage key={idx}
                                colonne={item}
                                language={props.language}
                                resolver={props.resolver} />
        )
      })}
    </CardDeck>
  )
}

function TypeInconnu(props) {
  return (
    <p>Partie de type inconnu</p>
  )
}

function PageColonneAffichage(props) {
  const colonne = props.colonne || {}
  const champHtml = colonne.html || {}

  const media = colonne.media || {},
        versionCourante = media.version_courante || {},
        fuuidPreview = versionCourante.fuuid_preview

  const [imgUrl, setImgUrl] = useState('')
  useEffect(_=>{
    if(fuuidPreview) {
      resolveFuuid(props.resolver, fuuidPreview, setImgUrl)
    }
  }, [fuuidPreview])

  // if(contenu.media) {
  //   return (
  //     <CardBodyView item={contenu.media}
  //                   usePoster={true}
  //                   rootProps={props.rootProps}>
  //       <RenderValeursMultilingueRows champ={htmlParsed} languages={props.site.languages}/>
  //     </CardBodyView>
  //   )
  // } else {

  return (
    <Card>
      {imgUrl?
        <Card.Img src={imgUrl} />
        :''
      }
      <Card.Body>
        <ChampHtmlMultilingue language={props.language}
                              contenu={champHtml} />
      </Card.Body>
    </Card>
  )
}

async function resolveFuuid(resolver, fuuid, setUrl) {
  const url = await resolver.resolveUrlFuuid(fuuid)
  setUrl(url)
}

async function chargerSection(resolver, sectionId, setContenuSection) {
  const {data} = await resolver.getSection(sectionId, 'pages')
  console.debug("!!! contenu section recu : %O", data)
  setContenuSection(data)
}
