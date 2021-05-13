const debug = require('debug')('millegrilles:vitrine:preparerCode')
const fsPromises = require('fs/promises')
const path = require("path")
const gzipUtils = require('./gzipUtils')

var _destinationCode = null

function init(destinationCode) {
  const destination = destinationCode || process.env.WEBAPPS_SRC_FOLDER
  debug("Set destinationCode : %s", destination)
  _destinationCode = destination
}

async function copierCode() {
  // Copie le code sous static/vitrine vers la destination specifiee
  if(!_destinationCode) {
    console.warn("WARN preparerCode.copierCode : le repertoire _destinationCode n'est pas configure")
    return
  }

  // const dest = '/tmp/vitrine'
  console.info("INFO preparerCode.copierCode Copie du code de vitrine vers %s", _destinationCode)
  try {
    await fsPromises.rm(_destinationCode, {recursive: true})
  } catch(err) {
    // OK
  }

  await copyRecursive('static/vitrine', _destinationCode)
}

async function sauvegarder(pathRelFichier, contenu, opts) {
  if(!_destinationCode) return  // Rien a faire

  const pathFichier = path.join(_destinationCode, pathRelFichier)
  const dirFichier = path.dirname(pathFichier)
  await fsPromises.mkdir(dirFichier, {recursive: true})

  debug("Sauvegarder fichier %s", pathFichier)
  await fsPromises.writeFile(pathFichier, contenu, opts)

  if(opts.gzip) {
    gzipUtils.sauvegarderGzip(pathFichier + '.gz', contenu)
  }
}

/**
 * From : https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
const copyRecursive = async (src, dest) => {
  var stats = await fsPromises.stat(src)
  var isDirectory = stats.isDirectory()
  if (isDirectory) {
    await fsPromises.mkdir(dest)
    const entries = await fsPromises.readdir(src)
    for await (let childItemName of entries) {
      await copyRecursive(path.join(src, childItemName),
                          path.join(dest, childItemName))
    }
  } else {
    await fsPromises.copyFile(src, dest)
  }
}

module.exports = {init, copierCode, sauvegarder}
