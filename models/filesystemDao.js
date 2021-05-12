const debug = require('debug')('millegrilles:vitrine:filesystemDao')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')
const readdirp = require('readdirp')
const zlib = require('zlib')
const { Readable } = require('stream')

async function sauvegarderMapping(noeudId, messageSites, amqpdao, opts) {
  if(!opts) opts = {}
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataVitrine = opts.pathDataVitrine || path.join(pathData, 'vitrine')
  const pathDataSites = opts.pathDataSites || path.join(pathDataVitrine, 'data/sites')

  debug("Sauvegarde mapping sites sous %s", pathDataSites)
  await _mkdirs(pathDataSites)

  await _sauvegarderIndex(messageSites.mapping, pathDataVitrine, amqpdao)

  debug("Sauvegarder sites : \n%O", messageSites.sites)
  for await(let site of messageSites.sites) {
    await _sauvegarderSite(site, pathDataSites, amqpdao)
  }
}

async function sauvegarderSite(messageSiteconfig, amqpdao, opts) {
  if(!opts) opts = {}
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataVitrine = opts.pathDataVitrine || path.join(pathData, 'vitrine')
  const pathDataSites = opts.pathDataSites || path.join(pathDataVitrine, 'data/sites')

  debug("Sauvegarde siteconfig sous %s", pathDataSites)
  await _mkdirs(pathDataSites)

  await _sauvegarderSite(messageSiteconfig, pathDataSites, amqpdao)
}

//
// async function sauvegarderPosts(messagePosts, amqpdao, opts) {
//   if(!opts) opts = {}
//   const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
//   const pathDataPosts = opts.pathDataPosts || path.join(pathData, 'vitrine/posts')
//
//   debug("Sauvegarde posts sous %s", pathDataPosts)
//   await _mkdirs(pathDataPosts)
//
//   for(const idx in messagePosts.liste_posts) {
//     const post = messagePosts.liste_posts[idx]
//     await _sauvegarderPost(post, pathDataPosts, amqpdao, messagePosts._certificat, opts)
//   }
// }

async function sauvegarderCollectionFichiers(message, amqpdao, opts) {
  if(!opts) opts = {}
  const pki = amqpdao.pki
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataVitrine = opts.pathDataVitrine || path.join(pathData, 'vitrine')
  const pathDataCollections = opts.pathDataCollections || path.join(pathDataVitrine, 'data/fichiers')

  const messageCollection = message.contenu_signe

  debug("Sauvegarde collections sous %s :\n%O", pathDataCollections, messageCollection)
  await _mkdirs(pathDataCollections)

  const uuidCollection = messageCollection.uuid
  const collectionJsonFile = path.join(pathDataCollections, uuidCollection + '.json')

  // S'assurer que le repertoire du site existe
  await _mkdirs(pathDataCollections)

  const collectionCopy = {...messageCollection}

  // Valider le message
  if( ! pki.verifierMessage(collectionCopy) ) {
    throw new Error("Signature de la collection %s est invalide", uuidCollection)
  }

  // Conserver le contenu du site
  const jsonContent = JSON.stringify(collectionCopy)
  debug("Ecrire fichier : %s", collectionJsonFile)
  await fsPromises.writeFile(collectionJsonFile, jsonContent)
  await sauvegarderContenuGzip(collectionJsonFile + '.gz', collectionCopy)
}

async function sauvegarderPage(message, amqpdao, opts) {
  if(!opts) opts = {}
  const pki = amqpdao.pki
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataPages = opts.pathDataCollections || path.join(pathData, 'vitrine/data/pages')

  debug("Sauvegarde collections sous %s :\n%O", pathDataPages, message)
  await _mkdirs(pathDataPages)

  const sectionId = message.section_id,
        contenu = {...message.contenu_signe}
  const pathFichierJson = path.join(pathDataPages, sectionId + '.json')

  // S'assurer que le repertoire du site existe
  await _mkdirs(pathDataPages)

  // Valider le message
  if( ! pki.verifierMessage(contenu) ) {
    throw new Error("Signature de la page %s est invalide", sectionId)
  }

  // Conserver le contenu du site
  const jsonContent = JSON.stringify(contenu)
  debug("Ecrire fichier : %s", pathFichierJson)
  await fsPromises.writeFile(pathFichierJson, jsonContent)
  await sauvegarderContenuGzip(pathFichierJson + '.gz', contenu)
}


async function listerCollections() {
  // Fait une liste de toutes les collections (ids)
  const pathData = '/var/opt/millegrilles/nginx/data'
  const pathDataCollections = path.join(pathData, 'vitrine/collections')

  const collections = []
  await new Promise((resolve, reject)=>{
    readdirp(pathDataCollections, {type: 'files', depth: 1})
    .on('data', entry=>{
      const basename = entry.basename
      const uuidCollection = basename.split('.')[0]
      collections.push(uuidCollection)
    })
    .on('end', _=>{resolve()})
    .on('error', err=>{reject(err)})
    .on('warn', err=>{reject(err)})
  })

  debug("Collections : %O", collections)
  return collections
}

// function _mapperSitesParUrl(noeudId, messageSites) {
//   const listeSites = messageSites.sites,
//         certs = messageSites._certificat
//   const sitesParUrl = {}
//   listeSites.forEach(site=>{
//     try {
//       const urlsSite = site.noeuds_urls[noeudId]
//       urlsSite.forEach(url=>{
//         sitesParUrl[url] = {...site, _certificat: certs}
//       })
//     } catch(err) {
//       debug("Erreur chargement urls pour site %s : %O", site.site_id, err)
//     }
//   })
//
//   return sitesParUrl
// }

async function _sauvegarderIndex(mapping, pathDataVitrine, amqpdao) {
  const pki = amqpdao.pki
  const mappingJsonFile = path.join(pathDataVitrine, 'index.json')

  // S'assurer que le repertoire du site existe
  await _mkdirs(pathDataVitrine)

  // Valider le message
  if( ! mapping || ! pki.verifierMessage(mapping) ) {
    console.error("ERROR filesystemDao._sauvegarderIndex mapping vide ou signature invalide \nmapping: %O", mapping)
    throw new Error("Mapping vide ou signature du mapping (index.json) est invalide")
  }

  // Conserver le contenu du site
  const jsonContent = JSON.stringify(mapping)
  await fsPromises.writeFile(mappingJsonFile, jsonContent, {encoding: 'utf8'})

  // Sauvegarder version gzip
  await sauvegarderContenuGzip(mappingJsonFile + '.gz', jsonContent)
}

function _sauvegarderSite(site, pathDataSites, amqpdao) {
  const pki = amqpdao.pki
  const site_id = site.site_id
  const siteJsonFile = path.join(pathDataSites, site_id + '.json')

  return new Promise(async (resolve, reject)=>{
    // S'assurer que le repertoire du site existe
    await _mkdirs(pathDataSites)

    // Valider le message
    if( ! pki.verifierMessage(site) ) {
      return reject(new Error("Signature du site %s est invalide", site.site_id))
    }

    // Conserver le contenu du site
    const jsonContent = JSON.stringify(site)
    fs.writeFile(siteJsonFile, jsonContent, {encoding: 'utf8'}, err=>{
      if(err) return reject(err)
      resolve()
    })

    // Sauvegarder version gzip
    await sauvegarderContenuGzip(siteJsonFile + '.gz', jsonContent)
  })
}

function _sauvegarderPost(post, pathDataPosts, amqpdao, certificat, opts) {
  if(!opts) opts = {}
  const pki = amqpdao.pki

  debug("Sauvegarder post %O", post)

  const postId = post.post_id
  const subFolder = path.join(pathDataPosts, postId.substring(0, 2))
  const postJsonFile = path.join(subFolder, postId + '.json')

  return new Promise(async (resolve, reject)=>{
    // S'assurer que le repertoire du site existe
    await _mkdirs(subFolder)

    if(opts.majSeulement) {
      // Sauvegarder le fichier uniquement si c'est un remplacement
      // Utile lorsqu'on recoit un post sur l'exchange public sans info du site/noeud
      const fichierExiste = await new Promise((resolve, reject)=>{
        fs.stat(postJsonFile, err=>{
          if(err) return resolve(false)
          resolve(true)
        })
      })
      debug("Le post id: %s est nouveau, mode majSeulement. Ignorer le fichier.", postId)
      if(!fichierExiste) return  // Abort, on ne sauvegarde pas le fichier (nouveau)
    }

    const postCopy = {...post, _certificat: certificat}

    // Valider le message
    if( ! pki.verifierMessage(postCopy) ) {
      return reject(new Error("Signature de la post id %s est invalide", post.post_id))
    }

    // Conserver le contenu du site
    const jsonContent = JSON.stringify(postCopy)
    fs.writeFile(postJsonFile, jsonContent, {encoding: 'utf8'}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

// function _sauvegarderCollection(collection, pathDataCollections, amqpdao, certificat) {
//   const pki = amqpdao.pki
//
//   debug("Sauvegarder collection %O", collection)
//
//   const uuidCollection = collection.uuid
//   const subFolder = path.join(pathDataCollections, uuidCollection.substring(0, 2))
//   const collectionJsonFile = path.join(subFolder, uuidCollection + '.json')
//
//   return new Promise(async (resolve, reject)=>{
//     // S'assurer que le repertoire du site existe
//     await _mkdirs(subFolder)
//
//     const collectionCopy = {...collection, _certificat: certificat}
//
//     // Valider le message
//     if( ! pki.verifierMessage(collectionCopy) ) {
//       return reject(new Error("Signature de la collection %s est invalide", uuidCollection))
//     }
//
//     // Conserver le contenu du site
//     const jsonContent = JSON.stringify(collectionCopy)
//     fs.writeFile(collectionJsonFile, jsonContent, {encoding: 'utf8'}, err=>{
//       if(err) return reject(err)
//       resolve()
//     })
//   })
// }

function _mkdirs(pathRepertoire) {
  return new Promise((resolve, reject)=>{
    fs.mkdir(pathRepertoire, {recursive: true}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

function sauvegarderContenuGzip(pathFichier, message) {
  const writeStream = fs.createWriteStream(pathFichier)
  const gzip = zlib.createGzip()
  gzip.pipe(writeStream)

  const promise = new Promise((resolve, reject)=>{
    writeStream.on('finish', _=>{resolve()})
    writeStream.on('error', err=>{reject(err)})
  })

  const readable = new Readable()
  readable._read = () => {}
  readable.pipe(gzip)
  readable.push(JSON.stringify(message))
  readable.push(null)

  return promise
}

module.exports = {
  sauvegarderMapping, sauvegarderSite, sauvegarderCollectionFichiers, sauvegarderPage,
  // sauvegarderPosts, sauvegarderCollections, listerCollections
}
