import React from 'react'
import axios from 'axios'
import parse from 'html-react-parser'

export class Post extends React.Component {

  state = {
    detailPost: ''
  }

  componentDidMount() {
    // Charger contenu du post
    console.debug("Charger post %O", this.props)
    const informationRangee = this.props
    const postId = informationRangee.post_id
    const subFolder = postId.substring(0, 2) + '/'
    const urlPost = '/vitrine/posts/' + subFolder + postId + '.json'
    axios.get(urlPost).then(reponse=>{
      console.debug("Reponse detail post id : %O", postId, reponse)
      this.setState({detailPost: reponse.data})
    }).catch(err=>{console.error("Erreur chargement post")})
  }

  render() {
    const detailPost = this.state.detailPost
    if(!detailPost) return ''

    const language = this.props.rootProps.language,
          html = detailPost.html[language]

    console.debug("Render html %s", html)

    const renderingContenu = parse(html)

    return renderingContenu
  }
}
