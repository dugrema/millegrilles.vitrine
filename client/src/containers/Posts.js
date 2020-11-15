import React from 'react'
import axios from 'axios'
import parse from 'html-react-parser'
import {Alert} from 'react-bootstrap'

import {verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'

export class Post extends React.Component {

  state = {
    err: '',
    detailPost: ''
  }

  componentDidMount() {
    // Charger contenu du post
    // console.debug("Charger post %O", this.props)
    const informationRangee = this.props
    const postId = informationRangee.post_id
    const subFolder = postId.substring(0, 2) + '/'
    const urlPost = '/vitrine/posts/' + subFolder + postId + '.json'
    axios.get(urlPost).then(reponse=>{
      const detailPost = reponse.data
      // console.debug("Reponse detail post id : %O", postId, detailPost)

      const certificateStore = this.props.rootProps.certificateStore

      // Valider contenu avec le certificat, idmg
      if ( ! verifierSignatureMessage(detailPost, detailPost._certificat, certificateStore) ) {
        throw new Error("Signature invalide")
      } else {
        this.setState({detailPost})
      }

    }).catch(err=>{
      console.error("Erreur chargement post : %O", err)
      this.setState({err: 'Post invalide ' + postId + ' : ' + err})
    })
  }

  render() {

    if(this.state.err) {
      return <Alert variant="warning">{this.state.err}</Alert>
    }

    const detailPost = this.state.detailPost
    if(!detailPost) return <p></p>

    var language = this.props.rootProps.language
    var html = detailPost.html[language]

    // console.debug("Render html %s", html)
    if(!html) {
      // Voir si on peut obtenir le contenu dans langue par defaut
      const languages = this.props.rootProps.siteConfiguration.languages
      language = languages[0]
      html = detailPost.html[language]
      if(!html) return <p> ... NO POST / PAS DE CONTENU ... </p>
    }

    return parse(html)
  }
}
