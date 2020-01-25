const os = require('os');
const fs = require('fs');
const path = require('path');

// Met a jour un fichier dans le repertoire data de la MilleGrille
function maj_fichier_data(pathFichier, contenu) {
  console.debug("Maj fichier data " + pathFichier);
  let pathRepertoire = path.dirname(pathFichier);
  fs.mkdir(pathRepertoire, { recursive: true }, (err)=>{
    if(err) {
      console.error("Erreur reception fichier " + pathFichier);
      return;
    }

    const writeStream = fs.createWriteStream(pathFichier, {flag: 'w', mode: 0o644});
    writeStream.write(contenu);
    writeStream.end();
  });
}

// Met a jour un fichier dans le repertoire data de la MilleGrille
function maj_collection(pathRepertoire, uuidCollection, contenu) {
  var pathFichier = path.join(pathRepertoire, uuidCollection + '.json');
  // console.debug("Maj collection data sous " + pathFichier);

  fs.mkdir(pathRepertoire, { recursive: true }, (err)=>{
    if(err) {
      console.error("Erreur reception collection " + uuidCollection);
      return;
    }

    const writeStream = fs.createWriteStream(pathFichier, {flag: 'w', mode: 0o644});
    writeStream.write(contenu);
    writeStream.end();
  });
}

module.exports = {maj_fichier_data, maj_collection}
