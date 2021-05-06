import React, {useState, useEffect} from 'react'
import {Switch, Route} from 'react-router'
import { Link, useParams, useLocation } from 'react-router-dom'
import {Row, Col, Card} from 'react-bootstrap'
import VisibilitySensor from 'react-visibility-sensor'

import {ChampMultilingue} from '../components/ChampMultilingue'
import {chargerCollections} from './SectionFichiers'

export default function SectionAlbum(props) {
  const section = props.section,
        resolver = props.workers.resolver

  // console.debug("Section : %O", section)
  const [collectionsFichiers, setCollectionsFichiers] = useState('')
  // console.debug("CollectionsFichiers : %O", collectionsFichiers)

  useEffect(_=>{
    chargerCollections(resolver, section, setCollectionsFichiers)
  }, [resolver, section])

  const entete = section.entete

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

  const collectionsUuid = Object.keys(collectionsFichiers)

    // Mode d'affichage de plusieurs collections
  return (
    <Switch>
      <Route path="/vitrine/section/:sectionIdx/:uuidCollection">
        <Switch>
          <Route path="/vitrine/section/:sectionIdx/:uuidCollection/:uuidFichier">
            <AfficherMedia collectionsFichiers={collectionsFichiers}
                           {...props} />
          </Route>
          <Route path="/vitrine/section/:sectionIdx/:uuidCollection">
            <AfficherAlbum collectionsFichiers={collectionsFichiers}
                           {...props} />
          </Route>
        </Switch>
      </Route>
      <Route>
        <AfficherListeAlbums collectionsFichiers={collectionsFichiers} {...props} />
      </Route>
    </Switch>
  )
}

function AfficherListeAlbums(props) {
  const collectionsFichiers = Object.values(props.collectionsFichiers)

  if(!props.collectionsFichiers) return ''

  // Trier par nom
  collectionsFichiers.sort((a,b)=>{
    const nomA = a.nom_collection || a.uuid,
          nomB = b.nom_collection || b.uuid
    return nomA.localeCompare(nomB)
  })

  console.debug("AffichierListeAlbums %O, collectionsFichiers: %O", props, collectionsFichiers)

  return (
    <>
      <Row>
        {collectionsFichiers.map(item=>(
          <AfficherPosterCollection key={item.uuid} collection={item} {...props} />
        ))}
      </Row>
    </>
  )
}

function AfficherPosterCollection(props) {
  const {sectionIdx} = useParams()
  const locationFichiers = useLocation()

  // Choisir un fichier de la liste (trier, prendre plus vieux fichier)
  const listeFichiers = props.collection.fichiers
  listeFichiers.sort(trierFichiers)
  const fichier = listeFichiers[0]

  const nomCollection = props.collection.nom_collection

  return (
    <AfficherPoster key={fichier.fuuid_v_courante}
                    fichier={fichier}
                    url={locationFichiers.pathname + '/' + props.collection.uuid}
                    caption={nomCollection}
                    {...props} />
  )
}

function AfficherAlbum(props) {
  var {uuidCollection} = useParams()
  uuidCollection = uuidCollection || props.uuidCollection

  console.debug("AfficherAlbum : %O, uuidCollection %O", props, uuidCollection)

  const [nombreAffiches, setNombreAffiches] = useState(20)
  const nextPostBatch = _ => {
    setNombreAffiches(nombreAffiches+20)
  }

  const collectionFichiers = Object.values(props.collectionsFichiers).filter(item=>item.uuid === uuidCollection)[0],
        nomCollection = collectionFichiers.nom_collection || collectionFichiers.uuid,
        fichiersTries = collectionFichiers.fichiers

  fichiersTries.sort(trierFichiers)

  return (
    <>
      <h3>{nomCollection}</h3>

      <Row>
        {fichiersTries.slice(0, nombreAffiches).map(item=>(
          <AfficherPoster key={item.fuuid_v_courante} fichier={item} {...props} />
        ))}
      </Row>

      <FinListe nextPostBatch={nextPostBatch} />
    </>
  )
}

function AfficherPoster(props) {
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const {sectionIdx} = useParams()
  const locationFichiers = useLocation()

  const [urlPreview, setUrlPreview] = useState('')
  useEffect( _ => {
    if(versionCourante.fuuid_preview) {
      resolver.resolveUrlFuuid(versionCourante.fuuid_preview, {mimetype: versionCourante.mimetype_preview})
      .then(val=>setUrlPreview(val))
    }
  }, [resolver, versionCourante])

  // console.debug("URL fichier : %s, preview: %s", urlFichier, urlPreview)

  const url = props.url || (locationFichiers.pathname + '/' + fichier.uuid)

  return (
    <Link to={url}>
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
  // console.debug("!!! AfficherMedia proppys %O", props)
  const locationPage = useLocation()
  var {uuidCollection, uuidFichier} = useParams()
  uuidCollection = uuidCollection || props.uuidCollection

  if(!props.collectionsFichiers) return ''

  const collectionFichiers = Object.values(props.collectionsFichiers).filter(item=>item.uuid === uuidCollection)[0],
        fichiers = collectionFichiers.fichiers || []

  var urlRetour = locationPage.pathname.split('/')
  urlRetour.pop()
  urlRetour = urlRetour.join('/')

  const fichier = fichiers.reduce((acc, item)=>{
    if(item.uuid === uuidFichier) return item
    return acc
  }, '')
  const versionCourante = fichier.version_courante
  // console.debug("Fichier charge (uuid: %s) : %O\nVersion courante: %O", uuidFichier, fichier, versionCourante)

  var mimetypeBase = versionCourante.mimetype
  if(mimetypeBase) {
    mimetypeBase = mimetypeBase.split('/')[0]
  }
  // console.debug("Mimetype base : O", mimetypeBase)

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

  useEffect( _ => {
    resolver.resolveUrlFuuid(fichier.fuuid_v_courante, versionCourante)
    .then(val => setUrlFichier(val))
  }, [resolver, fichier, versionCourante])

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

  useEffect( _ => {
    resolver.resolveUrlFuuid(fichier.fuuid_v_courante, versionCourante)
    .then(val=>setUrlFichier(val))
  }, [resolver, fichier, versionCourante])

  if(!urlFichier) return ''

  return (
    <Card.Img src={urlFichier} />
  )
}

function FinListe(props) {
  return (
    <VisibilitySensor onChange={isVisible => {
        // console.debug("Visible : %s", isVisible)
        if(isVisible) {
          props.nextPostBatch()
        }
      }}>
      <Row><Col xs={12}><span className="invisible">Fine</span></Col></Row>
    </VisibilitySensor>
  )
}

function TypeInconnu(props) {
  return <p>Type Inconnu</p>
}

// function trierCollections(language, a, b) {
//   if(a===b) return 0
//
//   const nomA = a.nom_collection || a.uuid,
//         nomB = b.nom_collection || b.uuid
//
//   return nomA.localeCompare(nomB)
// }

function trierFichiers(a, b) {
  if(a===b) return 0
  const dateA = a.version_courante.date_version,
        dateB = b.version_courante.date_version

  return dateB - dateA
}
