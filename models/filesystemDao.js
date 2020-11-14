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

function _mkdirs(pathRepertoire) {
  return new Promise((resolve, reject)=>{
    fs.mkdir(pathRepertoire, {recursive: true}, err=>{
      if(err) return reject(err)
      resolve()
    })
  })
}

module.exports = {sauvegarderSites}
