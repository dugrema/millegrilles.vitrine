import React from 'react'
import {Card, CardDeck} from 'react-bootstrap'

import {Post} from './Posts'

export function CardDeckMapping(props) {
  var cards = props.cards,
      renderedCards = ''
  if(cards) renderedCards = cards.map((card, colIdx)=>{

    var cardImage = '', cardTitle = ''
    if(card.image_url) {
      cardImage = <Card.Img variant="top" src={card.image_url} />
    }
    if(card.titre) {
      cardTitle = <Card.Title>{card.titre}</Card.Title>
    }
    if(card.sous_titre) {
      cardTitle = <Card.Title>{card.sous_titre}</Card.Title>
    }

    return (
      <Card key={colIdx} style={{ width: '18rem' }}>
        {cardImage}
        <Card.Body>
          {cardTitle}
          <Post key={card.post_id}
                rootProps={props.rootProps}
                post_id={card.post_id} />
        </Card.Body>
      </Card>
    )
  })

  return (
    <>
      <CardDeck>
        {renderedCards}
      </CardDeck>
    </>
  )
}
