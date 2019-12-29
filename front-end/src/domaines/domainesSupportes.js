import {SenseursPassifsVitrine} from './SenseursPassifs';

// La liste des domaines supportes est limite a ce qui est charge dans ce fichier
const domaines = {
  SenseursPassifs: SenseursPassifsVitrine,
}

const listeDomaines = {
  SenseursPassifs: {
    'fr': 'Senseurs Passifs'
  },
}

// Cette fonction effecute le mapping pour le menu de Vitrine
export function getDomaine(domaine) {
  return domaines[domaine];
}

export function listerDomaines() {
  return listeDomaines;
}
