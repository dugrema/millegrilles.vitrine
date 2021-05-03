import axios from 'axios'
import path from 'path'
import {preparerCertificateStore, verifierSignatureMessage} from '@dugrema/millegrilles.common/lib/pki2'
import {verifierIdmg} from '@dugrema/millegrilles.common/lib/idmg'
import mimetypeExtensions from '@dugrema/millegrilles.common/lib/mimetype_ext.json'

var _etatCdns = {},
    _siteConfiguration,
    _certificateStore,
    _idmg,
    _cdnCourant

const ETAT_INACTIF = 0,
      ETAT_INIT    = 1,
      ETAT_ACTIF   = 2,
      ETAT_ERREUR  = 3

export async function setSiteConfiguration(siteConfiguration) {
  _siteConfiguration = siteConfiguration

  if(!_certificateStore) {
    await chargerCertificateStore(siteConfiguration)
  }

  console.debug("Set Site config : %O", siteConfiguration)
  mergeCdns(_siteConfiguration.cdns)
  console.debug("CDNs initialises, commencer a verifier les sources")
}

function mergeCdns(cdns) {
  const cdnIdsConnus = Object.keys(_etatCdns)
  const cdnIdsRecus = cdns.reduce((acc, item)=>{
    return [...acc, item.cdn_id]
  }, [])

  // Ajouter / maj configuration des CDNs
  cdns.forEach(item=>{
    const cdnId = item.cdn_id
    if(!cdnIdsConnus.includes(cdnId)) {
      // Nouveau, ajouter
      _etatCdns[cdnId] = {config: item, etat: ETAT_INIT, tempsReponse: -1}
    } else {
      // Deja connu, on met a jour la configuration seulement
      _etatCdns[cdnId].config = item
    }
  })

  // Marquer CDN retire comme inactifs
  for(let cdnId in _etatCdns) {
    if(!cdnIdsRecus.includes(cdnId)) {
      _etatCdns[cdnId].etat = ETAT_INACTIF
    }
  }

  console.debug("Etat CDNS apres maj : %O", _etatCdns)
  verifierConnexionCdns()
}

export async function chargerSiteConfiguration(url) {
  const reponse = await getUrl(url, {noverif: true})
  const siteConfiguration = reponse.data
  await setSiteConfiguration(siteConfiguration)
  return siteConfiguration
}

export async function getUrl(url, opts) {
  opts = opts || {}
  const reponse = await axios({method: 'get', url, timeout: 15000})

  if(!opts.noverif) {
    const data = reponse.data
    // Verifier la signature de la ressource
    let signatureValide = await verifierSignatureMessage(data, data._certificat, _certificateStore)
    if(!signatureValide) {
      throw new Error(`Signature {$url} invalide`)
    }
    // console.debug("Signature %s est valide", url)
  }

  return {status: reponse.status, data: reponse.data}
}

export async function getSection(uuidSection, typeSection, ipnsMapping) {
  if(!_cdnCourant) throw new Error("Aucun CDN n'est disponible")

  const typeCdn = _cdnCourant.type_cdn
  if(typeCdn === 'ipfs') {

  } else if(typeCdn === 'ipfs_gateway') {

  } else {
    const accessPointUrl = _cdnCourant.config.access_point_url
    var urlRessource = ''
    switch(typeSection) {
      case 'fichiers':
        urlRessource = '/data/fichiers/' + uuidSection + '.json'
        break
      case 'pages':
        urlRessource = '/data/pages/' + uuidSection + '.json'
        break
      case 'forum':
        urlRessource = '/data/forums/' + uuidSection + '.json'
        break
      default:
        console.debug("Type section inconnue : %s", typeSection)
    }
    const urlComplet = accessPointUrl + urlRessource
    // console.debug("Chargement section url %s", urlComplet)
    return getUrl(urlComplet)
  }
}

export async function resolveUrlFuuid(fuuid, mimetype) {
  if(!_cdnCourant) throw new Error("Aucun CDN n'est disponible")

  const typeCdn = _cdnCourant.type_cdn
  if(typeCdn === 'ipfs') {

  } else if(typeCdn === 'ipfs_gateway') {

  } else {
    const accessPointUrl = _cdnCourant.config.access_point_url
    const part1 = fuuid.slice(0, 5),
          part2 = fuuid.slice(5, 7)
    const ext = mimetypeExtensions[mimetype]

    const pathFuuid = path.join('fichiers/public', part1, part2, fuuid + '.' + ext)

    const urlRessource = accessPointUrl + '/' + pathFuuid
    return urlRessource
  }
}

async function verifierConnexionCdns() {
  /* Parcours les CDN et trouve ceux qui sont actifs. */

  // Extraire CDN en ordre de preference de la configuration
  const cdnIds = _siteConfiguration.cdns.reduce((acc, item)=>{return [...acc, item.cdn_id]}, [])

  // Verifier la presence de path/index.json sur chaque CDN
  var cdnCourant = null
  for await (let cdnId of cdnIds) {
    const etatCdn = _etatCdns[cdnId]
    const typeCdn = etatCdn.config.type_cdn
    switch(typeCdn) {
      case 'sftp':
      case 'awss3':
      case 'ipfs_gateway':
        await verifierEtatAccessPoint(cdnId)
        break
      case 'ipfs':
        await verifierEtatIpfs(cdnId)
        break
      default:
        console.debug("Type CDN inconnu : %s", typeCdn)
    }

    if(!cdnCourant && etatCdn.etat === ETAT_ACTIF) {
      cdnCourant = etatCdn
    }
  }

  if(cdnCourant) {
    // Mettre a jour le CDN utilise
    _cdnCourant = cdnCourant
  }

  console.debug("Etat CDNs : %O", _etatCdns)
}

async function verifierEtatAccessPoint(cdnId) {
  const etatCdn = _etatCdns[cdnId],
        config = etatCdn.config

  const accessPointUrl = config.access_point_url
  const urlRessource = accessPointUrl + '/index.json'
  try {
    const dateDebut = new Date().getTime()
    const reponse = await getUrl(urlRessource)
    const tempsReponse = new Date().getTime()-dateDebut
    etatCdn.etat = ETAT_ACTIF
    etatCdn.tempsReponse = tempsReponse
  } catch(err) {
    etatCdn.etat = ETAT_ERREUR
    etatCdn.tempsReponse = -1
    console.error("Erreur access point : %O\n%O", etatCdn, err)
  }
}

async function verifierEtatIpfs(cdnId) {

}

async function chargerCertificateStore(siteConfiguration) {
  // Preparer le certificate store avec le CA pour valider tous les .json telecharges
  const caPem = [...siteConfiguration['_certificat']].pop()  // Dernier certificat dans la liste

  // Valider le idmg - millegrille.pem === info.idmg
  const idmg = siteConfiguration['en-tete'].idmg
  verifierIdmg(idmg, caPem)
  console.debug("IDMG verifie OK avec PEM = %s", idmg)

  try {
    const certificateStore = preparerCertificateStore(caPem)

    // Valider la signature de index.json (siteConfiguration)
    let signatureValide = await verifierSignatureMessage(
      siteConfiguration, siteConfiguration._certificat, certificateStore)

    if(!signatureValide) {
      console.error("Erreur verification index.json - signature invalide")
      throw new Error("Erreur verification index.json - signature invalide")
    }

    _certificateStore = certificateStore
    _idmg = idmg

  } catch(err) {
    console.error("Erreur verification index.json : %O", err)
    throw new Error("Erreur verification index.json - date certificat ou signature invalide")
  }

}
