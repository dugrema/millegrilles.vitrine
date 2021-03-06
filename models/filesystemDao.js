const debug = require('debug')('millegrilles:vitrine:filesystemDao')
const path = require('path')
const fs = require('fs')
const readdirp = require('readdirp')

async function sauvegarderSites(noeudId, messageSites, amqpdao, opts) {
  if(!opts) opts = {}
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataSites = opts.pathDataSites || path.join(pathData, 'vitrine/sites')

  debug("Sauvegarde sites sous %s", pathDataSites)
  await _mkdirs(pathDataSites)

  const sitesParUrl = _mapperSitesParUrl(noeudId, messageSites)
  debug("Sauvegarder mapping sites par url local : \n%O", sitesParUrl)
  for(const url in sitesParUrl) {
    const site = sitesParUrl[url]
    await _sauvegarderSite(url, site, pathDataSites, amqpdao)
  }
}

async function sauvegarderPosts(messagePosts, amqpdao, opts) {
  if(!opts) opts = {}
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataPosts = opts.pathDataPosts || path.join(pathData, 'vitrine/posts')

  debug("Sauvegarde posts sous %s", pathDataPosts)
  await _mkdirs(pathDataPosts)

  for(const idx in messagePosts.liste_posts) {
    const post = messagePosts.liste_posts[idx]
    await _sauvegarderPost(post, pathDataPosts, amqpdao, messagePosts._certificat, opts)
  }
}

async function sauvegarderCollections(messageCollections, amqpdao, opts) {
  if(!opts) opts = {}
  const pathData = opts.pathData || '/var/opt/millegrilles/nginx/data'
  const pathDataCollections = opts.pathDataCollections || path.join(pathData, 'vitrine/collections')

  debug("Sauvegarde collections sous %s :\n%O", pathDataCollections, messageCollections.liste_collections)
  await _mkdirs(pathDataCollections)

  for(const idx in messageCollections.liste_collections) {
    const collection = messageCollections.liste_collections[idx]
    await _sauvegarderCollection(
      collection, pathDataCollections, amqpdao, messageCollections._certificat)
  }
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

function _mapperSitesParUrl(noeudId, messageSites) {
  const listeSites = messageSites.liste_sites,
        certs = messageSites._certificat
  const sitesParUrl = {}
  listeSites.forEach(site=>{
    try {
      const urlsSite = site.noeuds_urls[noeudId]
      urlsSite.forEach(url=>{
        sitesParUrl[url] = {...site, _certificat: certs}
      })
    } catch(err) {
      debug("Erreur chargement urls pour site %s : %O", site.site_id, err)
    }
  })

  return sitesParUrl
}

function _sauvegarderSite(urlDomain, site, pathDataSites, amqpdao) {
  const pki = amqpdao.pki
  const pathSite = path.join(pathDataSites, urlDomain)
  const siteJsonFile = path.join(pathSite, 'index.json')

  return new Promise(async (resolve, reject)=>{
    // S'assurer que le repertoire du site existe
    await _mkdirs(pathSite)

    // Valider le message
    if( ! pki.verifierSignatureMessage(site) ) {
      return reject(new Error("Signature du site %s est invalide", site.site_id))
    }

    // Conserver le contenu du site
    const jsonContent = JSON.stringify(site)
    fs.writeFile(siteJsonFile, jsonContent, {encoding: 'utf8'}, err=>{
      if(err) return reject(err)
      resolve()
    })
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
    if( ! pki.verifierSignatureMessage(postCopy) ) {
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

function _sauvegarderCollection(collection, pathDataCollections, amqpdao, certificat) {
  const pki = amqpdao.pki

  debug("Sauvegarder collection %O", collection)

  const uuidCollection = collection.uuid
  const subFolder = path.join(pathDataCollections, uuidCollection.substring(0, 2))
  const collectionJsonFile = path.join(subFolder, uuidCollection + '.json')

  return new Promise(async (resolve, reject)=>{
    // S'assurer que le repertoire du site existe
    await _mkdirs(subFolder)

    const collectionCopy = {...collection, _certificat: certificat}

    // Valider le message
    if( ! pki.verifierSignatureMessage(collectionCopy) ) {
      return reject(new Error("Signature de la collection %s est invalide", uuidCollection))
    }

    // Conserver le contenu du site
    const jsonContent = JSON.stringify(collectionCopy)
    fs.writeFile(collectionJsonFile, jsonContent, {encoding: 'utf8'}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

function _mkdirs(pathRepertoire) {
  return new Promise((resolve, reject)=>{
    fs.mkdir(pathRepertoire, {recursive: true}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

module.exports = {sauvegarderSites, sauvegarderPosts, sauvegarderCollections, listerCollections}
