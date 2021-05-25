import React, {useState, useEffect} from 'react'
import {Row, Col, Button, Card} from 'react-bootstrap'

import {ChampMultilingue} from '../components/ChampMultilingue'
import { DateTimeAfficher, FileSizeFormatter } from '../components/ReactFormatters'
import { Trans } from 'react-i18next'

export default function SectionFichiers(props) {
  const section = props.section,
        resolver = props.workers.resolver

  // console.debug("Section : %O", section)
  // const [collectionsFichiers, setCollectionsFichiers] = useState('')
  // console.debug("CollectionsFichiers : %O", collectionsFichiers)

  const [collectionsFichiers, setCollectionsFichiers] = useState('')
  const {contenuSection: contenuSectionEvent, setContenuSection: setContenuSectionEvent} = props

  // Reset contenu global sur load et unload de la page
  useEffect(_=>{setContenuSectionEvent('')}, [])

  useEffect(_=>{
    // On a eu un changement de section, recharger le contenu
    const setContenuSectionCb = contenuSection => {
      console.debug("Load collection fichiers %O", contenuSection)
      setCollectionsFichiers(contenuSection)
      setContenuSectionEvent(contenuSection)
    }
    if(!contenuSectionEvent) {
      chargerCollections(resolver, section, setCollectionsFichiers)
    }
  }, [contenuSectionEvent, resolver, section])

  const entete = section.entete

  return (
    <>
      <h2>
        <ChampMultilingue language={props.language} contenu={entete} />
      </h2>

      <AfficherCollectionsFichiers language={props.language}
                                   collectionsFichiers={collectionsFichiers}
                                   resolver={resolver} />
    </>
  )
}

function AfficherCollectionsFichiers(props) {
  if(!props.collectionsFichiers) return ''

  const listeFichiers = Object.values(props.collectionsFichiers)
  listeFichiers.sort((a,b)=>{return trierCollections(props.language, a, b)})
  // console.debug("Liste fichiers triee : %O", listeFichiers)

  return listeFichiers.map(item=>(
    <AfficherCollectionFichiers key={item.uuid}
                                collectionFichiers={item}
                                {...props} />
  ))
}

function AfficherCollectionFichiers(props) {
  const collectionFichiers = props.collectionFichiers,
        nomCollection = collectionFichiers.nom_collection || collectionFichiers.uuid

  const fichiersTries = collectionFichiers.fichiers
  fichiersTries.sort(trierFichiers)

  return (
    <div className="fichier-collection">
      <h3>{nomCollection}</h3>
      {fichiersTries.map(item=>(
        <AfficherRowFichier key={item.fuuid_v_courante}
                            fichier={item}
                            {...props} />
      ))}
    </div>
  )
}

function AfficherRowFichier(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const fuuid = fichier.fuuid_v_courante
  const nomFichier = fichier.nom_fichier || fuuid
  const fuuids = props.collectionFichiers.fuuids || {}
  console.debug("AfficherRowFichier props: %O, fuuids : %O", props, fuuids)

  const [urlFichier, setUrlFichier] = useState('')
  useEffect(_ => {
    const fuuidsInfos = fuuids[fuuid]
    console.debug("AfficherRowFichier fuuidsInfos : %O", fuuidsInfos)
    resolver.resolveUrlFuuid(fichier.fuuid_v_courante, {...fuuidsInfos, ...versionCourante})
    .then(val=>setUrlFichier(val))
  }, [resolver, fichier, fuuids])
  const [urlPreview, setUrlPreview] = useState('')
  useEffect(_ => {
    if(versionCourante.fuuid_preview) {
      const fuuidsInfos = fuuids[versionCourante.fuuid_preview]
      console.debug("AfficherRowFichier fuuidsInfos : %O", fuuidsInfos)
      resolver.resolveUrlFuuid(versionCourante.fuuid_preview, {...fuuidsInfos, mimetype: versionCourante.mimetype_preview})
      .then(val=>setUrlPreview(val))
    }
  }, [resolver, fuuids])

  // console.debug("URL fichier : %s, preview: %s", urlFichier, urlPreview)

  return (
    <Row>
      <Col lg={2}>
        <a href={urlFichier} download={nomFichier}>
          <Card className="fichier-browsing-img">
            {urlPreview?
              <Card.Img variant="bottom" src={urlPreview} />
              :<Trans>fichiers.fichier</Trans>
            }
          </Card>
        </a>
      </Col>
      <Col lg={6} className="filename">
        <Button variant="link" href={urlFichier} download={nomFichier}>
          {nomFichier}
        </Button>
      </Col>
      <Col lg={2}>
        <FileSizeFormatter nb={versionCourante.taille} />
      </Col>
      <Col lg={2}>
        <DateTimeAfficher date={versionCourante.date_version} />
      </Col>
    </Row>
  )
}

function trierCollections(language, a, b) {
  if(a===b) return 0

  const nomA = a.nom_collection || a.uuid,
        nomB = b.nom_collection || b.uuid

  return nomA.localeCompare(nomB)
}

function trierFichiers(a, b) {
  if(a===b) return 0
  const nomA = a.nom_fichier || a.fuuid_v_courante,
        nomB = b.nom_fichier || b.fuuid_v_courante

  return nomA.localeCompare(nomB)
}

export async function chargerCollections(resolver, section, setCollectionsFichiers) {
  if(!section.collections) {
    setCollectionsFichiers({})
    return
  }

  const collectionsFichiers = {}
  section.collections.forEach(async collectionId => {
    // console.debug("Charger collection - data : %O", collectionId)
    const reponse = await resolver.getSection(collectionId, 'fichiers')
    // console.debug("Resultat getSection : %O", reponse)
    collectionsFichiers[collectionId] = reponse.data
    setCollectionsFichiers({...collectionsFichiers})
  })
}
