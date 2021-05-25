import React, {useState, useEffect} from 'react'
import { Card, CardDeck } from 'react-bootstrap'

import {ChampMultilingue, ChampHtmlMultilingue} from '../components/ChampMultilingue'

export default function SectionPage(props) {
  const section = props.section,
        resolver = props.workers.resolver,
        sectionId = section.section_id

  const [contenuSection, setContenuSection] = useState('')
  const {contenuSection: contenuSectionEvent, setContenuSection: setContenuSectionEvent} = props

  var estampille = 0
  if(contenuSection['en-tete']) {
    estampille = contenuSection['en-tete'].estampille || 0
  }

  // Reset contenu global sur load pour s'assurer de recharger la page
  useEffect(_=>{
    console.debug("Update sectionId %s, estampille : %s", sectionId, estampille)
    setContenuSectionEvent('')
  }, [sectionId, estampille])

  useEffect(_=>{
    // On a eu un changement de section, recharger le contenu
    const setContenuSectionCb = contenuSection => {
      console.debug("Load section %O", contenuSection)
      setContenuSection(contenuSection)
      setContenuSectionEvent(contenuSection)
    }
    if(!contenuSectionEvent) {
      chargerSection(resolver, sectionId, setContenuSectionCb)
    }
  }, [contenuSectionEvent, resolver, sectionId])

  const partiesPages = contenuSection.parties_pages,
        entete = section.entete

  return (
    <>
      <AfficherPartiesPages partiesPages={partiesPages}
                            contenuSection={contenuSection}
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
      <div key={idx} className="partie-page">
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
        fuuid = versionCourante.fuuid_preview

  const [imgUrl, setImgUrl] = useState('')
  useEffect(_=>{
    if(fuuid) {
      resolveFuuid(props.resolver, fuuid, props.contenuSection.fuuids, setImgUrl)
    }
  }, [fuuid, props.resolver, props.contenuSection])

  if(imgUrl) {
    return <img src={imgUrl} alt="Pas d'abord"/>
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
                                contenuSection={props.contenuSection}
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
      resolveFuuid(props.resolver, fuuidPreview, props.contenuSection.fuuids, setImgUrl)
    }
  }, [fuuidPreview, props.resolver, props.contenuSection])

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

async function resolveFuuid(resolver, fuuid, fuuidsMapping, setUrl) {
  const url = await resolver.resolveUrlFuuid(fuuid, fuuidsMapping[fuuid])
  setUrl(url)
}

async function chargerSection(resolver, sectionId, setContenuSection) {
  const {data} = await resolver.getSection(sectionId, 'pages')
  setContenuSection(data)
}
