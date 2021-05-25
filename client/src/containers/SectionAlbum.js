import React, {useState, useEffect} from 'react'
import {Switch, Route} from 'react-router'
import { Link, Redirect, useParams, useLocation } from 'react-router-dom'
import {Row, Col, Card} from 'react-bootstrap'
import VisibilitySensor from 'react-visibility-sensor'

import {ChampMultilingue} from '../components/ChampMultilingue'
import {chargerCollections} from './SectionFichiers'

export default function SectionAlbum(props) {
  const section = props.section,
        resolver = props.workers.resolver

  // console.debug("Section : %O", section)
  //const [collectionsFichiers, setCollectionsFichiers] = useState('')
  // console.debug("CollectionsFichiers : %O", collectionsFichiers)

  // const {contenuSection: collectionsFichiers, setContenuSection: setCollectionsFichiers} = props

  const [collectionsFichiers, setCollectionsFichiers] = useState('')
  const {contenuSection: contenuSectionEvent, setContenuSection: setContenuSectionEvent} = props

  // Reset contenu global sur load et unload de la page
  useEffect(_=>{
    console.debug("!!! Update, contenuSection : %O", contenuSectionEvent)
    setContenuSectionEvent('')
  }, [contenuSectionEvent])

  useEffect(_=>{
    // On a eu un changement de section, recharger le contenu
    const setContenuSectionCb = contenuSection => {
      console.debug("Load coollection fichiers %O", contenuSection)
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

      <AfficherAlbums language={props.language}
                      section={section}
                      collectionsFichiers={collectionsFichiers}
                      resolver={resolver} />
    </>
  )
}

function AfficherAlbums(props) {
  const collectionsFichiers = props.collectionsFichiers
  if(!collectionsFichiers) return ''

  // const collectionsUuid = Object.keys(collectionsFichiers)

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
        <AfficherListeAlbums collectionsFichiers={collectionsFichiers}
                             {...props} />
      </Route>
    </Switch>
  )
}

function AfficherListeAlbums(props) {
  const collectionsFichiers = Object.values(props.collectionsFichiers)
  const locationPath = useLocation()

  console.debug("!!! AfficherListeAlbums proppys : %O", props)

  if(props.section.collections && props.section.collections.length === 1) {
    const uuidCollection = props.section.collections[0]
    const pathCollection = locationPath.pathname + '/' + uuidCollection
    return <Redirect to={pathCollection} />
  }

  if(!props.collectionsFichiers || !props.section.collections || props.section.collections.length === 0) {
    return (
      <p>Aucun album n'est partage.</p>
    )
  }

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
  // const {sectionIdx} = useParams()
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
  const locationPath = useLocation()
  uuidCollection = uuidCollection || props.uuidCollection

  console.debug("AfficherAlbum : %O, uuidCollection %O", props, uuidCollection)

  const [nombreAffiches, setNombreAffiches] = useState(20)
  const nextPostBatch = _ => {
    setNombreAffiches(nombreAffiches+20)
  }

  var linkRetour = ''
  if(props.section.collections.length > 1) {
    var urlRetour = locationPath.pathname.split('/')
    urlRetour.pop()
    urlRetour = urlRetour.join('/')
    linkRetour = <Link to={urlRetour}>Retour</Link>
  }

  const collectionFichiers = Object.values(props.collectionsFichiers).filter(item=>item.uuid === uuidCollection)[0]
  if(!collectionFichiers) return ''

  const nomCollection = collectionFichiers.nom_collection || collectionFichiers.uuid,
        fichiersTries = collectionFichiers.fichiers

  fichiersTries.sort(trierFichiers)

  return (
    <>
      <h3>{nomCollection}</h3>

      {linkRetour}

      <Row>
        {fichiersTries.slice(0, nombreAffiches).map(item=>(
          <AfficherPoster key={item.fuuid_v_courante}
                          collection={collectionFichiers}
                          fichier={item}
                          {...props} />
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

  // console.debug("!!! Poster proppys : %O", props)

  // const {sectionIdx} = useParams()
  const locationFichiers = useLocation()

  const fuuidsInfos = props.collection.fuuids || {}

  const [urlPreview, setUrlPreview] = useState('')
  useEffect( _ => {
    if(versionCourante.fuuid_preview) {
      const fuuid = versionCourante.fuuid_preview
      const infoFuuid = fuuidsInfos[fuuid] || {mimetype: versionCourante.mimetype_preview}
      // console.debug("Fuuid : %s, infofuuid : %O", fuuid, infoFuuid)
      resolver.resolveUrlFuuid(fuuid, infoFuuid)
      .then(val=>setUrlPreview(val))
    }
  }, [resolver, versionCourante, props.collection])

  // console.debug("URL fichier : %s, preview: %s", urlFichier, urlPreview)

  const url = props.url || (locationFichiers.pathname + '/' + fichier.uuid)

  return (
    <Link to={url}>
      <Card className="fichier-browsing-img">
        {urlPreview?
          <Card.Img variant="top" src={urlPreview} />
          :'Fichier'
        }
        {props.caption?
          <Card.Footer>{props.caption}</Card.Footer>
          :''
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
      <Viewer fichier={fichier}
              collectionFichiers={collectionFichiers}
              {...props} />
    </Card>
  )
}

function AfficherImage(props) {
  // console.debug("!!! AfficherImage proppys: %O", props)
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        resolver = props.resolver

  const [urlFichier, setUrlFichier] = useState('')
  const fuuidsInfo = props.collectionFichiers.fuuids || {}

  useEffect( _ => {
    const fuuid = fichier.fuuid_v_courante
    const fuuidInfo = {...fuuidsInfo[fuuid], ...versionCourante}
    // console.debug("!!! FUUIDS info AfficherImage : %O", fuuidInfo)
    resolver.resolveUrlFuuid(fuuid, fuuidInfo)
    .then(val => setUrlFichier(val))
  }, [resolver, fichier, versionCourante])

  if(!urlFichier) return ''

  return (
    <Card.Img src={urlFichier} />
  )
}

function AfficherVideo(props) {
  // console.debug("!!! PROPPYS video : %O", props)
  const fichier = props.fichier,
        versionCourante = fichier.version_courante,
        video = versionCourante.video,
        resolver = props.resolver

  // Extraire liste de formats video par defaut
  const resolutionMax = 720
  const dictFormats = Object.keys(video).reduce((acc, format)=>{
    const resolution = format[1]
    const infoVideo = video[format]
    const codecVideo = infoVideo.codecVideo
    // console.debug("!!! format video : %O, info: %O, codec: %O", format, infoVideo, codecVideo)
    var infoFormat = acc[codecVideo]
    if(infoFormat) {
      // Plusieurs formats pour le meme mimetype
      if(infoFormat.resolution < resolution && resolution <= resolutionMax) {
        // Remplacer un format de resolution inferieur
        return {...acc, [codecVideo]: infoVideo}
      }
    } else {
      // Valeur initiale pour ce mimetype
      return {...acc, [codecVideo]: infoVideo}
    }
    return acc
  }, {})

  // console.debug("Dict formats video : %O", dictFormats)

  // Trier les formats en ordre de preference
  const listeFormats = Object.values(dictFormats).sort((a,b)=>{
    const codecVideoA = a.codecVideo,
          codecVideoB = b.codecVideo
    if(codecVideoA === codecVideoB) return 0

    // Mettre h264 a la fin de la liste
    if(codecVideoA === 'h264') return 1
    if(codecVideoB === 'h264') return -1

    // S'assurer d'avoir un trie regulier
    const mimetypeA = a.mimetype,
          mimetypeB = b.mimetype
    return mimetypeA.localeCompare(mimetypeB)
  })

  // console.debug("Liste formats video : %O", listeFormats)

  const [urlsVideo, setUrlsVideo] = useState('')

  useEffect( _ => {
    const promises = listeFormats.map(item=>{
      return resolver.resolveUrlFuuid(item.fuuid, item)
          .then(val=>{return {...item, url: val}})
    })
    Promise.all(promises).then(urls=>{
      // console.debug("URLS : %O", urls)
      setUrlsVideo(urls)
    })
  }, [resolver, fichier, versionCourante, listeFormats])

  if(!urlsVideo) return ''

  return (
    <video className="video" controls autoPlay>
      {urlsVideo.map(item=>(
        <source key={item.url} src={item.url} type={item.mimetype} />
      ))}
        Your browser does not support the video tag.
    </video>
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
