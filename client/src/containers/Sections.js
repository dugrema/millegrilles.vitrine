import React from 'react'
import axios from 'axios'
import {Row, Col, CardColumns, Card} from 'react-bootstrap'

import {ChampMultilingue} from '../components/ChampMultilingue'
import {verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'

export function Section(props) {
  if(props.section.type === 'fichiers') {
    return <SectionFichiers {...props} />
  } else if(props.section.type === 'album') {
    return <SectionAlbums {...props} />
  }
  return 'Section inconnue : ' + props.type
}

class SectionFichiers extends React.Component {

  state = {
    collections: '',
    collectionId: '',  // Id collection courante (affichee)
  }

  componentDidMount() {
    const section = this.props.section
    // console.debug("Section : %O", section)

    chargerCollections(section, this.props.rootProps).then(collections=>{
      this.setState({collections})
    })

  }

  setCollectionId = event => {
    const collectionId = event.currentTarget.value
    this.setState({collectionId})
  }

  render() {
    const section = this.props.section

    return (
      <>
        <h1>
          <ChampMultilingue rootProps={this.props.rootProps} contenu={section.entete} />
        </h1>

        <AfficherCollections rootProps={this.props.rootProps} collections={this.state.collections}/>
      </>
    )
  }
}

class SectionAlbums extends React.Component {

  state = {
    collections: '',
    collectionId: '',  // Id collection courante (affichee)
  }

  componentDidMount() {
    const section = this.props.section
    // console.debug("Section : %O", section)

    chargerCollections(section, this.props.rootProps).then(collections=>{
      this.setState({collections})
    })

  }

  setCollectionId = event => {
    const collectionId = event.currentTarget.value
    this.setState({collectionId})
  }

  render() {
    const section = this.props.section

    return (
      <>
        <h1>
          <ChampMultilingue rootProps={this.props.rootProps} contenu={section.entete} />
        </h1>

        <AfficherAlbums rootProps={this.props.rootProps} collections={this.state.collections}/>
      </>
    )
  }
}

function AfficherCollections(props) {
  const collections = props.collections

  if(collections) {

    collections.sort((a,b)=>{
      const na=a.nom_collection, nb=b.nom_collection
      return na.localeCompare(nb)
    })

    return props.collections.map((c, idx)=>{
      return <AfficherCollection key={idx} rootProps={props.rootProps} collection={c} />
    })
  }
  return ''
}

function AfficherCollection(props) {
  const collection = props.collection
  const fichiers = collection.fichiers

  // Retirer les sous-collections (non supporte)
  const copieFichiers = fichiers.filter(f=>f.nom_fichier)

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
        {collection.nom_collection}
      </h2>
      {fichiersRendered}
    </>
  )
}

function Fichier(props) {
  const fichier = props.fichier
  const url = '/fichiers/' + fichier.fuuid
  return (
    <Row>
      <Col md={0} lg={1}></Col>
      <Col sm={12} lg={6}>
        <a href={url}>
          {fichier.nom_fichier}
        </a>
      </Col>
      <Col sm={12} lg={5}>{fichier.taille} bytes, {fichier.date_version} (s epoch)</Col>
    </Row>
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
      return <AfficherCollectionAlbum key={idx} rootProps={props.rootProps} collection={c} />
    })

    return (
      <CardColumns>
        {collectionsRendered}
      </CardColumns>
    )
  }
  return ''
}

function AfficherCollectionAlbum(props) {
  const collection = props.collection
  const fichiers = collection.fichiers.filter(item=>{return item.mimetype && item.mimetype.startsWith('image/')})
  console.debug("Collection %O\nImages dans la collection : %O", collection, fichiers)

  var fuuidPreview = collection.fuuid_preview
  if( !fuuidPreview && fichiers && fichiers.length > 0) {
    fuuidPreview = fichiers[0].fuuid
  }

  return (
    <Card border="secondary">
      <Card.Img variant="top" src={"/fichiers/" + fuuidPreview + "?preview=1"} />
      <Card.Body>
        <Card.Title>{collection.nom_collection}</Card.Title>
      </Card.Body>
    </Card>
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
