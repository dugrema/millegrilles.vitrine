import React, {useState, useEffect} from 'react'
import {Switch, Route} from 'react-router'
import { Link, useParams, useLocation } from 'react-router-dom'
import parse from 'html-react-parser'
import {Row, Col, Button, Card} from 'react-bootstrap'

import {ChampMultilingue, ChampHtmlMultilingue} from '../components/ChampMultilingue'
import {chargerCollections} from './SectionFichiers'

export default function SectionAlbum(props) {
  const section = props.section,
        resolver = props.workers.resolver

  // console.debug("Section : %O", section)
  const [collectionsFichiers, setCollectionsFichiers] = useState('')
  // console.debug("CollectionsFichiers : %O", collectionsFichiers)

  useEffect(_=>{
    chargerCollections(resolver, section, setCollectionsFichiers)
  }, [])

  const entete = section.entete

  // <AfficherCollectionsFichiers language={props.language}
  //                              collectionsFichiers={collectionsFichiers}
  //                              resolver={resolver} />

  return (
    <>
      <h2>
        <ChampMultilingue language={props.language} contenu={entete} />
      </h2>

      <AfficherAlbums language={props.language}
                      collectionsFichiers={collectionsFichiers}
                      resolver={resolver} />
    </>
  )
}

function AfficherAlbums(props) {
  const collectionsFichiers = props.collectionsFichiers
  if(!collectionsFichiers) return ''

  const listeFichiers = Object.values(collectionsFichiers)

  if(listeFichiers.length === 1) {
    // Mode direct, pas de navigation vers les collections
    const collectionFichier = listeFichiers[0]
    return (
      <Switch>
        <Route path="/vitrine/section/:sectionIdx/:uuidFichier">
          <AfficherMedia collectionFichiers={collectionFichier}
                         {...props} />
        </Route>
        <Route>
          <AfficherAlbum collectionFichiers={collectionFichier} {...props} />
        </Route>
      </Switch>
    )
  } else {
    // Mode d'affichage de plusieurs collections
    return <p>TODO</p>
  }
}

function AfficherCollectionsFichiers(props) {
  if(!props.collectionsFichiers) return ''

  const listeFichiers = Object.values(props.collectionsFichiers)
  listeFichiers.sort((a,b)=>{return trierCollections(props.language, a, b)})
  // console.debug("Liste fichiers triee : %O", listeFichiers)

  return listeFichiers.map(item=>(
    <AfficherAlbum key={item.uuid}
                   collectionFichiers={item}
                   {...props} />
  ))
}

function AfficherAlbum(props) {
  const collectionFichiers = props.collectionFichiers,
        nomCollection = collectionFichiers.nom_collection || collectionFichiers.uuid

  const fichiersTries = collectionFichiers.fichiers
  fichiersTries.sort(trierFichiers)

  return (
    <>
      <h3>{nomCollection}</h3>
      {fichiersTries.map(item=>(
        <AfficherPoster key={item.fuuid_v_courante} fichier={item} {...props} />
      ))}
    </>
  )
}

function AfficherPoster(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const {sectionIdx} = useParams()

  const nomFichier = fichier.nom_fichier || fichier.fuuid_v_courante

  const [urlPreview, setUrlPreview] = useState('')
  useEffect(async _=> {
    if(versionCourante.fuuid_preview) {
      const val = await resolver.resolveUrlFuuid(versionCourante.fuuid_preview, {mimetype: versionCourante.mimetype_preview})
      setUrlPreview(val)
    }
  }, [versionCourante])

  // console.debug("URL fichier : %s, preview: %s", urlFichier, urlPreview)

  return (
    <Link to={sectionIdx + '/' + fichier.uuid}>
      <Card className="fichier-browsing-img">
        {urlPreview?
          <Card.Img variant="bottom" src={urlPreview} />
          :'Fichier'
        }
      </Card>
    </Link>
  )
}

function AfficherMedia(props) {
  console.debug("!!! AfficherMedia proppys %O", props)
  const locationPage = useLocation()
  const {sectionIdx, uuidFichier} = useParams()

  var urlRetour = locationPage.pathname.split('/')
  urlRetour.pop()
  urlRetour = urlRetour.join('/')

  const collectionFichiers = props.collectionFichiers || '',
        fichiers = collectionFichiers.fichiers || [],
        resolver = props.resolver

  const fichier = fichiers.reduce((acc, item)=>{
    if(item.uuid === uuidFichier) return item
    return acc
  }, '')
  const versionCourante = fichier.version_courante
  console.debug("Fichier charge (uuid: %s) : %O\nVersion courante: %O", uuidFichier, fichier, versionCourante)

  var mimetypeBase = versionCourante.mimetype
  if(mimetypeBase) {
    mimetypeBase = mimetypeBase.split('/')[0]
  }
  console.debug("Mimetype base : O", mimetypeBase)

  var Viewer = TypeInconnu
  switch(mimetypeBase) {
    case 'image': Viewer = AfficherImage; break
    case 'video': Viewer = AfficherVideo; break
    default:
  }

  return (
    <Card className="card-viewing">
      <Card.Header>
        <Link to={urlRetour}>Retour</Link>
      </Card.Header>
      <Viewer fichier={fichier} {...props} />
    </Card>
  )
}

function AfficherImage(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const [urlFichier, setUrlFichier] = useState('')

  useEffect(async _=> {
    const val = await resolver.resolveUrlFuuid(fichier.fuuid_v_courante, versionCourante)
    setUrlFichier(val)
  }, [fichier])

  if(!urlFichier) return ''

  return (
    <Card.Img src={urlFichier} />
  )
}

function AfficherVideo(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const [urlFichier, setUrlFichier] = useState('')

  useEffect(async _=> {
    const val = await resolver.resolveUrlFuuid(fichier.fuuid_v_courante, versionCourante)
    setUrlFichier(val)
  }, [fichier])

  if(!urlFichier) return ''

  return (
    <Card.Img src={urlFichier} />
  )
}

function TypeInconnu(props) {
  return <p>Type Inconnu</p>
}

function trierCollections(language, a, b) {
  if(a===b) return 0

  const nomA = a.nom_collection || a.uuid,
        nomB = b.nom_collection || b.uuid

  return nomA.localeCompare(nomB)
}

function trierFichiers(a, b) {
  if(a===b) return 0
  const dateA = a.version_courante.date_version,
        dateB = b.version_courante.date_version

  return dateB - dateA
}
