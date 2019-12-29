import {SenseursPassifsVitrine} from './SenseursPassifs';

// La liste des domaines supportes est limite a ce qui est charge dans ce fichier
const domaines = {
  SenseursPassifs: SenseursPassifsVitrine,
}

// Cette fonction effecute le mapping pour le menu de Vitrine
export function getDomaine(domaine) {
  return domaines[domaine];
}

export function listerDomaines() {
  return Object.keys(domaines);
}
