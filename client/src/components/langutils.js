
// Fonction pour traduire les elements selon le standard MilleGrille
// element : Dict element
// etiquette : element dans le dict (e.g. element[etiquette])
// language : langue presentement utilisee a l'ecran
// configurationMilleGrille : document de configuration global fourni a tous les modules
export function traduire(element, etiquette, language, configurationMilleGrille) {
  var languagePrincipal = null;
  if(configurationMilleGrille) {
    languagePrincipal = configurationMilleGrille.langue;
  }
  if(language === languagePrincipal) {
    return element[etiquette]
  } else {
    return element[etiquette + '_' + language] || element[etiquette];
  }
}
