import parse from 'html-react-parser'

export function ChampMultilingue(props) {
  const langue = props.language
  return props.contenu[langue] || ''
}

export function ChampHtmlMultilingue(props) {
  const langue = props.language
  const contenu = props.contenu[langue]

  if(contenu) {
    const contenuParsed = parse(contenu)
    return <div>{contenuParsed}</div>
  }

  return ''
}
