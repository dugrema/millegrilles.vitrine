import React, {useState, useEffect} from 'react'
import parse from 'html-react-parser'
import {Row, Col, Button, Card} from 'react-bootstrap'

import {ChampMultilingue, ChampHtmlMultilingue} from '../components/ChampMultilingue'

export default function SectionFichiers(props) {
  const section = props.section,
        resolver = props.workers.resolver

  // console.debug("Section : %O", section)
  const [collectionsFichiers, setCollectionsFichiers] = useState('')
  // console.debug("CollectionsFichiers : %O", collectionsFichiers)

  useEffect(_=>{
    chargerCollections(resolver, section, setCollectionsFichiers)
  }, [])

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
        <AfficherRowFichier key={item.fuuid_v_courante} fichier={item} {...props} />
      ))}
    </div>
  )
}

function AfficherRowFichier(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const nomFichier = fichier.nom_fichier || fichier.fuuid_v_courante

  const [urlFichier, setUrlFichier] = useState('')
  useEffect(async _=> {
    const val = await resolver.resolveUrlFuuid(fichier.fuuid_v_courante, versionCourante)
    setUrlFichier(val)
  }, [fichier])
  const [urlPreview, setUrlPreview] = useState('')
  useEffect(async _=> {
    if(versionCourante.fuuid_preview) {
      const val = await resolver.resolveUrlFuuid(versionCourante.fuuid_preview, {mimetype: versionCourante.mimetype_preview})
      setUrlPreview(val)
    }
  }, [versionCourante])

  // console.debug("URL fichier : %s, preview: %s", urlFichier, urlPreview)

  return (
    <Row>
      <Col lg={2}>
        <a href={urlFichier} download={nomFichier}>
          <Card className="fichier-browsing-img">
            {urlPreview?
              <Card.Img variant="bottom" src={urlPreview} />
              :'Fichier'
            }
          </Card>
        </a>
      </Col>
      <Col lg={4}>
        <Button variant="link" href={urlFichier} download={nomFichier}>
          {nomFichier}
        </Button>
      </Col>
      <Col lg={2}>
        {versionCourante.taille}
      </Col>
      <Col lg={4}>
        {versionCourante.date_version}
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
  const collectionsFichiers = {}
  const promisesCollections = section.collections.map(async collectionId => {
    // console.debug("Charger collection - data : %O", collectionId)
    const reponse = await resolver.getSection(collectionId, 'fichiers')
    // console.debug("Resultat getSection : %O", reponse)
    collectionsFichiers[collectionId] = reponse.data
    setCollectionsFichiers({...collectionsFichiers})
  })
}
