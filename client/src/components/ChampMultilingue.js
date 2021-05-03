
export function ChampMultilingue(props) {
  const langue = props.language
  return props.contenu[langue] || ''
}
