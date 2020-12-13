import React from 'react'
import parse from 'html-react-parser'
import axios from 'axios'
import {Row, Col, CardColumns, Card, Button} from 'react-bootstrap'
import { useParams } from "react-router-dom"

import {ChampMultilingue} from '../components/ChampMultilingue'
import {verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'
import { useTranslation, Trans } from 'react-i18next'
import {SiteBlogPost} from './Site'
import {DateTimeAfficher, FileSizeFormatter} from '../components/ReactFormatters'

export function Section(props) {
  const valeursParams = useParams()
  // console.debug("Section props : %O\n%O", props, valeursParams)
  const sectionIdx = valeursParams.sectionIdx
  const section = props.rootProps.siteConfiguration.sections[sectionIdx]
  // console.debug("Section active (%s): %O", sectionIdx, section)

  if(section.type === 'fichiers') {
    return <SectionFichiers section={section} sectionIdx={sectionIdx} {...props} />
  } else if(section.type === 'album') {
    return <SectionAlbums section={section} sectionIdx={sectionIdx} {...props} />
  } else if(section.type === 'blogposts') {
    return <AffichageBlogposts section={section} sectionIdx={sectionIdx} {...props} />
  }
  return 'Section inconnue : ' + valeursParams.type
}

class SectionFichiers extends React.Component {

  state = {
    section: '',
    collections: '',
    collectionId: '',  // Id collection courante (affichee)
  }

  componentDidMount() {
    const section = this.props.section
    this.chargerSection(section)
  }

  componentDidUpdate() {
    if(this.state.section !== this.props.section) {
      this.chargerSection(this.props.section)
    }
  }

  async chargerSection(section) {
    this.setState({section, collectionId: ''})  // Bloquer sur la nouvelle section, evite multiple refresh
    chargerCollections(section, this.props.rootProps).then(async collections=>{

      // Valider les collections
      const certificateStore = this.props.rootProps.certificateStore
      var collectionsValides = []
      for(let idx in collections) {
        const c = collections[idx]
        if(verifierSignatureMessage(c, c._certificat, certificateStore)) {
          collectionsValides.push(c)
        } else {
          console.error("Signature collection invalide : %s", c.uuid)
        }
      }

      this.setState({
        section,
        collections: collectionsValides
      }, _=>{
        if(collections.length === 1) {
          // Forcer ouverture de la (seule) collection recue
          const collectionId = collections[0].uuid
          this.setState({collectionId})
        }
      })
    })
  }

  setCollectionId = event => {
    const collectionId = event.currentTarget.value
    this.setState({collectionId})
  }

  render() {
    const section = this.props.section

    var contenu = ''
    if(this.state.collectionId) {
      const c = this.state.collections.filter(item=>item.uuid === this.state.collectionId)[0]
      contenu = <AfficherCollection rootProps={this.props.rootProps}
                                    collection={c}
                                    collections={this.state.collections}
                                    section={this.props.section}
                                    setCollectionId={this.setCollectionId} />
    } else {
      contenu = (
        <>
          <AfficherCollections rootProps={this.props.rootProps}
                               collections={this.state.collections}
                               section={this.props.section}
                               setCollectionId={this.setCollectionId} />
        </>
      )
    }

    return contenu
  }
}

class SectionAlbums extends React.Component {

  state = {
    collections: '',
    collectionId: '',  // Id collection courante (affichee)
    imageFuuid: '',
  }

  componentDidMount() {
    const section = this.props.section
    this.chargerSection(section)
  }

  componentDidUpdate() {
    if(this.state.section !== this.props.section) {
      this.chargerSection(this.props.section)
    }
  }

  setCollectionId = event => {
    const collectionId = event.currentTarget.value || event.currentTarget.dataset.uuid
    console.debug("Set collection ID : %s", collectionId)
    this.setState({collectionId})
  }

  setImageFuuid = event => {
    const imageFuuid = event.currentTarget.value || event.currentTarget.dataset.fuuid
    const imageMimetype = event.currentTarget.dataset.mimetype
    console.debug("Set image fuuid : %s", imageFuuid)
    this.setState({imageFuuid, imageMimetype})
  }

  async chargerSection(section) {
    this.setState({section, collectionId: ''})  // Bloquer sur la nouvelle section, evite multiple refresh
    chargerCollections(section, this.props.rootProps).then(async collections=>{

      // Valider les collections
      const certificateStore = this.props.rootProps.certificateStore
      var collectionsValides = []
      for(let idx in collections) {
        const c = collections[idx]
        if(verifierSignatureMessage(c, c._certificat, certificateStore)) {
          collectionsValides.push(c)
        } else {
          console.error("Signature collection invalide : %s", c.uuid)
        }
      }

      this.setState({
        section,
        collections: collectionsValides
      }, _=>{
        if(collections.length === 1) {
          // Forcer ouverture de la (seule) collection recue
          const collectionId = collections[0].uuid
          this.setState({collectionId})
        }
      })
    })
  }

  render() {
    const section = this.props.section
    const langue = this.props.rootProps.language

    var contenu = ''
    if(this.state.imageFuuid) {
      // console.debug("Etat, props pour afficher image : state: %O, \nprops: %O", this.state, this.props)
      const collection = this.state.collections.filter(item=>item.uuid === this.state.collectionId)
      var fichierInfo = collection[0].fichiers.filter(item=>item.fuuid === this.state.imageFuuid)
      fichierInfo = fichierInfo[0]

      var ElementMedia = null
      if(this.state.imageMimetype.startsWith('video/')) {
        ElementMedia = AffichageVideoAlbum
      } else if(this.state.imageMimetype.startsWith('image/')) {
        ElementMedia = AffichageImageSimpleAlbum
      }

      // console.debug("Chargement fichier (langue: %s): %O", langue, fichierInfo)
      var titreFichier = fichierInfo.nom_fichier
      if(fichierInfo.titre && fichierInfo.titre[langue]) {
        titreFichier = fichierInfo.titre[langue]
      }

      contenu = (
        <>
          <div>
            <Row>
              <Col>
                <h1>{titreFichier}</h1>
                <Button onClick={this.setImageFuuid}><Trans>global.retour</Trans></Button>
                {" "}
                <Button href={"/fichiers/public/" + this.state.imageFuuid}>
                  <i className="fa fa-download" />
                </Button>
              </Col>
            </Row>

            <br/>
          </div>
          <ElementMedia rootProps={this.props.rootProps}
                        fuuid={this.state.imageFuuid}
                        mimetype={this.state.imageMimetype}
                        fichierInfo={fichierInfo} />
        </>
      )
    } else if(this.state.collectionId) {
      const collection = this.state.collections.filter(item=>item.uuid === this.state.collectionId)[0]

      var boutonBack = <Button onClick={this.setCollectionId}><Trans>global.retour</Trans></Button>

      if(!collection) {
        return (
          <>
            <p>Erreur dans la collection / Error with the collection</p>
            {boutonBack}
          </>
        )
      }

      // console.debug("Charger collection %O", collection)
      var titreCollection = collection.nom_collection
      if(collection.titre && collection.titre[langue]) {
        titreCollection = collection.titre[langue]
      }

      if(this.state.collections.length === 1) {
        // On a une seule collection a afficher dans la section, pas de back
        boutonBack = ''
      }

      contenu = (
        <>
          <div>
            <h1>{titreCollection}</h1>
            {boutonBack}
            <br/>
            <br/>
          </div>
          <AffichageImagesAlbum rootProps={this.props.rootProps}
                                collection={collection}
                                setCollectionId={this.setCollectionId}
                                setImageFuuid={this.setImageFuuid} />
        </>
      )
    } else {
      contenu = <AfficherAlbums rootProps={this.props.rootProps}
                                collections={this.state.collections}
                                setCollectionId={this.setCollectionId}
                                section={section} />
    }

    return (
      <>
        {contenu}
      </>
    )
  }
}

function AfficherCollections(props) {
  const collections = props.collections

  var collectionsRendered = ''
  if(collections) {

    collections.sort((a,b)=>{
      const na=a.nom_collection, nb=b.nom_collection
      return na.localeCompare(nb)
    })

    collectionsRendered = props.collections.map((c, idx)=>{
      return <AfficherCollectionFichier key={idx}
                                        rootProps={props.rootProps}
                                        collection={c}
                                        setCollectionId={props.setCollectionId} />
    })
  }

  return (
    <>
      <h1>
        <ChampMultilingue rootProps={props.rootProps} contenu={props.section.entete} />
      </h1>
      {collectionsRendered}
    </>
  )
}

function AfficherCollectionFichier(props) {

  const langue = props.rootProps.language,
        collection = props.collection

  var nomCollection = collection.nom_collection
  if(collection.titre && collection.titre[langue]) {
    nomCollection = collection.titre[langue]
  }

  var parsedDescription = ''
  if(collection.description && collection.description[langue]) {
    parsedDescription = (
      <Row>
        <Col>
          {parse(collection.description[langue])}
        </Col>
      </Row>
    )
  }

  return (
    <Row className="collection-row">
      <Col sm={12} md={4}>
        <Button variant="link"
                onClick={props.setCollectionId}
                value={collection.uuid}>
          {nomCollection}
        </Button>
      </Col>
      <Col sm={12} md={8}>
        {parsedDescription}
      </Col>
    </Row>
  )
}

function AfficherCollection(props) {
  const collection = props.collection

  var boutonBack = <Button onClick={props.setCollectionId}><Trans>global.retour</Trans></Button>

  if(!collection) {
    return (
      <>
        <p>Erreur dans la collection / Error with the collection</p>
        {boutonBack}
      </>
    )
  }
  const fichiers = collection.fichiers

  // Retirer les sous-collections (non supporte)
  if(fichiers) {
    const copieFichiers = fichiers.filter(f=>f.nom_fichier)

    const langue = props.rootProps.language
    var nomCollection = collection.nom_collection
    if(collection.titre && collection.titre[langue]) {
      nomCollection = collection.titre[langue]
    }

    var parsedDescription = ''
    if(collection.description && collection.description[langue]) {
      parsedDescription = (
        <Row className="document-description">
          <Col>
            {parse(collection.description[langue])}
          </Col>
        </Row>
      )
    }
    var boutonBack = <Button onClick={props.setCollectionId}><Trans>global.retour</Trans></Button>
    if(props.collections.length === 1) {
      // On a une seule collection a afficher dans la section, pas de back
      boutonBack = ''
    }

    // Trier fichiers par nom
    copieFichiers.sort((a,b)=>{
      const na=a.nom_fichier, nb=b.nom_fichier
      return na.localeCompare(nb)
    })

    const fichiersRendered = copieFichiers.map(f=>{
      return <Fichier key={f.uuid} rootProps={props.rootProps} fichier={f} />
    })

    return (
      <>
        <h2>
          {nomCollection}
        </h2>

        <Row>
          <Col>
            {boutonBack}
          </Col>
        </Row>

        {parsedDescription}

        {fichiersRendered}
      </>
    )
  }

  // Par defaut, pas de fichiers
  return ''
}

function Fichier(props) {
  const fichier = props.fichier
  const url = '/fichiers/public/' + fichier.fuuid

  const langue = props.rootProps.language
  var nomFichier = fichier.nom_fichier
  if(fichier.titre && fichier.titre[langue]) {
    nomFichier = fichier.titre[langue]
  }

  var parsedDescription = ''
  if(fichier.description && fichier.description[langue]) {
    parsedDescription = parse(fichier.description[langue])
  }

  return (
    <>
      <Row>
        <Col sm={12} md={4} className="fichier-nom">
          <a href={url}>{nomFichier}</a>
          <div className="fichier-metadata">
            <DateTimeAfficher date={fichier.date_version}/><br/>
            <FileSizeFormatter nb={fichier.taille} />
          </div>
        </Col>
        <Col sm={12} md={8} className="fichier-description">
          {parsedDescription}
        </Col>
      </Row>
    </>
  )
}

function AfficherAlbums(props) {
  const collections = props.collections

  if(collections) {

    collections.sort((a,b)=>{
      const na=a.nom_collection, nb=b.nom_collection
      return na.localeCompare(nb)
    })

    const collectionsRendered = props.collections.map((c, idx)=>{
      return <AfficherCollectionAlbum key={idx} rootProps={props.rootProps}
                                      collection={c}
                                      setCollectionId={props.setCollectionId} />
    })

    return (
      <>
        <h1>
          <ChampMultilingue rootProps={props.rootProps} contenu={props.section.entete} />
        </h1>

        <CardColumns>
          {collectionsRendered}
        </CardColumns>
      </>
    )
  }
  return ''
}

function AfficherCollectionAlbum(props) {
  const collection = props.collection,
        langue = props.rootProps.language

  if(collection.fichiers) {
    const fichiers = collection.fichiers.filter(
      item=>{
        return item.mimetype &&
              (item.mimetype.startsWith('image/') || item.mimetype.startsWith('video/'))
      }
    )
    // console.debug("Collection %O\nImages dans la collection : %O", collection, fichiers)

    var fuuidPreview = collection.fuuid_preview
    if( !fuuidPreview && fichiers && fichiers.length > 0) {
      fuuidPreview = fichiers[0].fuuid
    }

    var titreCollection = collection.nom_collection
    if(collection.titre && collection.titre[langue]) {
      titreCollection = collection.titre[langue]
    }

    return (
      <Card border="secondary"
            onClick={props.setCollectionId}
            data-uuid={collection.uuid}>
        <Card.Img variant="top" src={"/fichiers/public/" + fuuidPreview + "?preview=1"} />
        <Card.Body>
          <Card.Title>{titreCollection}</Card.Title>
        </Card.Body>
      </Card>
    )
  }

  return ''
}

function AffichageImagesAlbum(props) {
  const collection = props.collection,
        langue = props.rootProps.language

  const fichiers = collection.fichiers.filter(
    item=>{
      return item.mimetype &&
             (item.mimetype.startsWith('image/') || item.mimetype.startsWith('video/'))
    }
  )
  fichiers.sort((a,b)=>{
    const na=a.nom_fichier, nb=b.nom_fichier
    return na.localeCompare(nb)
  })

  var description = ''
  if(langue && collection.description && collection.description[langue]) {
    const parsedHtml = parse(collection.description[langue])
    description = (
      <Row className="document-description">
        <Col>
          {parsedHtml}
        </Col>
      </Row>
    )
  }

  // console.debug("Collection %O\nImages dans la collection : %O", collection, fichiers)
  if(fichiers) {
    const imagesRendered = fichiers.map((f, idx)=>{
      const mimetype = f.mimetype
      return <AfficherImageAlbum key={idx} rootProps={props.rootProps}
                                 fichier={f}
                                 setImageFuuid={props.setImageFuuid} />
    })

    return (
      <>
        {description}
        <CardColumns>
          {imagesRendered}
        </CardColumns>
      </>
    )
  }
  return ''
}

function AfficherImageAlbum(props) {
  const fichier = props.fichier

  const fuuidPreview = fichier.fuuid
  const langue = props.rootProps.language
  var nomFichier = fichier.nom_fichier
  if(langue && fichier.titre && fichier.titre[langue]) {
    nomFichier = fichier.titre[langue]
  }

  return (
    <Card border="secondary"
          data-fuuid={fichier.fuuid}
          data-mimetype={fichier.mimetype}
          onClick={props.setImageFuuid}>
      <Card.Img variant="top" src={"/fichiers/public/" + fuuidPreview + "?preview=1"} />
      <Card.Body>
        <Card.Title>{nomFichier}</Card.Title>
      </Card.Body>
    </Card>
  )
}

function AffichageImageSimpleAlbum(props) {
  const fuuidPreview = props.fuuid

  const langue = props.rootProps.language,
        fichier = props.fichierInfo

  var nomFichier = fichier.nom, description = ''
  if(langue && fichier.titre && fichier.titre[langue]) {
    nomFichier = fichier.titre[langue]
  }
  if(langue && fichier.description && fichier.description[langue]) {
    const parsedHtml = parse(fichier.description[langue])
    description = (
      <div>
        {parsedHtml}
      </div>
    )
  }

  return (
    <>
      <img className="image-fullsize" src={"/fichiers/public/" + fuuidPreview + "?nofile=1"} />
      {description}
    </>
  )
}

function AffichageVideoAlbum(props) {
  const fuuid = props.fuuid,
        fichierInfo = props.fichierInfo,
        langue = props.rootProps.language

  var description
  if(langue && fichierInfo.description && fichierInfo.description[langue]) {
    const parsedHtml = parse(fichierInfo.description[langue])
    description = (
      <div>
        {parsedHtml}
      </div>
    )
  }


  var video = fichierInfo.video
  if(video && video['480p']) {
    var info480p = video['480p']
    return (
      <>
        <video controls>
          <source src={'/fichiers/public/' + fuuid + '?video=480p'} type={info480p.mimetype}/>
            Your browser does not support the video tag.
        </video>
        {description}
      </>
    )
  } else {
    return (
      <>
        <img className="image-fullsize" src={"/fichiers/public/" + fuuid + "?preview=1"} />
        <p>Video streaming not available - click <i className="fa fa-download"/> to download.</p>
        <p>Streaming non disponible - cliquez <i className="fa fa-download"/> pour telecharger.</p>
      </>
    )
  }
  return ''
}

function AffichageBlogposts(props) {
  console.debug("Props info : %O", props)
  const section = props.section
  return (
    <>
      <h2><ChampMultilingue contenu={section.entete} rootProps={props.rootProps}/></h2>
      <SiteBlogPost {...props} />
    </>
  )
}

async function chargerCollections(section, rootProps) {
  var toutesCollections = section.toutes_collections === true,
      collections = section.collections

  if(toutesCollections) {
    // console.debug("Charger toutes les collections")
    const reponseToutesCollections = await axios.get('/vitrine/listeCollections.json')
    const messageToutesCollections = reponseToutesCollections.data
    const certificateStore = rootProps.certificateStore
    // Valider contenu avec le certificat, idmg
    if ( ! verifierSignatureMessage(messageToutesCollections, messageToutesCollections._certificat, certificateStore) ) {
      throw new Error("Signature invalide")
    }
    collections = reponseToutesCollections.data.liste_collections
  }

  // console.debug("Charger collections %O", collections)
  var promises = []
  collections.forEach(c=>{
    const subfolder = c.substring(0, 2)
    promises.push(axios.get('/vitrine/collections/' + subfolder + '/' + c + '.json'))
  })
  const resultatsAxios = await Promise.all(promises)
  const resultats = resultatsAxios.map(c=>c.data)

  // console.debug("Resultats : %O", resultats)
  return resultats
}
