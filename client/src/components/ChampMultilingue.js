
export function ChampMultilingue(props) {
  const langue = props.rootProps.language
  return props.contenu[langue] || ''
}
