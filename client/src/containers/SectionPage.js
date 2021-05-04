import React, {useState, useEffect} from 'react'
import parse from 'html-react-parser'
import { Card, CardDeck } from 'react-bootstrap'

import {ChampMultilingue, ChampHtmlMultilingue} from '../components/ChampMultilingue'

export default function SectionPage(props) {
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
  const media = props.partiePage.media || {},
        versionCourante = media.version_courante || {},
        fuuid = versionCourante.fuuid_preview,
        mimetype = versionCourante.mimetype_preview

        // fuuid = media.fuuid_v_courante,
        // mimetype = media.mimetype

  const [imgUrl, setImgUrl] = useState('')
  useEffect(_=>{
    if(fuuid) {
      resolveFuuid(props.resolver, fuuid, mimetype, setImgUrl)
    }
  }, [fuuid])

  if(imgUrl) {
    return <img src={imgUrl} />
  }

  return 'MEDIA'
}

function TypeColonnes(props) {
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
        fuuidPreview = versionCourante.fuuid_preview,
        mimetypePreview = versionCourante.mimetype_preview

  const [imgUrl, setImgUrl] = useState('')
  useEffect(_=>{
    if(fuuidPreview) {
      resolveFuuid(props.resolver, fuuidPreview, mimetypePreview, setImgUrl)
    }
  }, [fuuidPreview])

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

async function resolveFuuid(resolver, fuuid, mimetype, setUrl) {
  const url = await resolver.resolveUrlFuuid(fuuid, mimetype)
  setUrl(url)
}

async function chargerSection(resolver, sectionId, setContenuSection) {
  const {data} = await resolver.getSection(sectionId, 'pages')
  setContenuSection(data)
}