const debug = require('debug')('millegrilles:vitrine:preparerCode')
const fsPromises = require('fs/promises')
const path = require("path")

async function copierCode(opts) {
  // Copie le code sous static/vitrine vers la destination specifiee
  opts = opts || {}

  const dest = opts.dest || process.env.CODE_DEST_FOLDER

  // const dest = '/tmp/vitrine'
  if(dest) {
    console.info("INFO preparerCode.copierCode Copie du code de vitrine vers %s", dest)
    try {
      await fsPromises.rm(dest, {recursive: true})
    } catch(err) {
      // OK
    }

    await copyRecursive('static/vitrine', dest)
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

module.exports = copierCode
