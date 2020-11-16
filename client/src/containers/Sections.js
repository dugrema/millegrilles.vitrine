import React from 'react'
import axios from 'axios'
import {Row, Col} from 'react-bootstrap'

import {ChampMultilingue} from '../components/ChampMultilingue'

export function Section(props) {
  if(props.section.type === 'fichiers') {
    return <SectionFichiers {...props} />
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
    console.debug("Section : %O", section)

    chargerCollections(section).then(collections=>{
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
      <Row>
        <Col>
          {collection.nom_collection}
        </Col>
      </Row>
      {fichiersRendered}
    </>
  )
}

function Fichier(props) {
  const fichier = props.fichier
  const url = '/fichiers/' + fichier.fuuid
  return (
    <Row>
      <Col md={1}></Col>
      <Col md={6}>
        <a href={url}>
          {fichier.nom_fichier}
        </a>
      </Col>
      <Col md={5}>{fichier.taille} bytes, {fichier.date_version} (s epoch)</Col>
    </Row>
  )
}

async function chargerCollections(section) {
  var toutesCollections = section.toutes_collections === true,
      collections = section.collections

  if(toutesCollections) {
    console.debug("Charger toutes les collections")
    return []
  } else {
    console.debug("Charger collections %O", collections)
    var promises = []
    collections.forEach(c=>{
      const subfolder = c.substring(0, 2)
      promises.push(axios.get('/vitrine/collections/' + subfolder + '/' + c + '.json'))
    })
    const resultatsAxios = await Promise.all(promises)
    const resultats = resultatsAxios.map(c=>c.data)

    console.debug("Resultats : %O", resultats)
    return resultats
  }
}
