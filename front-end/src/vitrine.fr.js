const properties = {
  "application.nom": "Vitrine",
  "menu.albums": "Albums",
  "menu.documents": "Documents",
  "menu.fichiers": "Fichiers",
  "menu.domaines": "Par domaine",
}

class Properties {
   get(label) {
     return properties[label];
   }
}

export default new Properties();
