
export function ChampMultilingue(props) {
  const langue = props.language || props.rootProps.language
  return props.contenu[langue] || ''
}
