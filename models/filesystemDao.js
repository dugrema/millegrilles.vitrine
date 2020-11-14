const debug = require('debug')('millegrilles:vitrine:filesystemDao')
const path = require('path')
const fs = require('fs')

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
    await _sauvegarderPost(post, pathDataPosts, amqpdao, messagePosts._certificat)
  }

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
      debug("Erreur chargement urls pour site %s", site.site_id)
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

function _sauvegarderPost(post, pathDataPosts, amqpdao, certificat) {
  const pki = amqpdao.pki

  debug("Sauvegarder post %O", post)

  const postId = post.post_id
  const subFolder = path.join(pathDataPosts, postId.substring(0, 2))
  const postJsonFile = path.join(subFolder, postId + '.json')

  return new Promise(async (resolve, reject)=>{
    // S'assurer que le repertoire du site existe
    await _mkdirs(subFolder)

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

function _mkdirs(pathRepertoire) {
  return new Promise((resolve, reject)=>{
    fs.mkdir(pathRepertoire, {recursive: true}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

module.exports = {sauvegarderSites, sauvegarderPosts}
