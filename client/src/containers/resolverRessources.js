import axios from 'axios'
import path from 'path'
import {gunzip} from 'zlib'
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
  _cdnCourant = mergeCdns(_siteConfiguration.cdns)
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
  var opts = {}
  if(!_cdnCourant) opts.initial = true  // S'accroche au premier CDN qui repond
  return verifierConnexionCdns(opts)  // Conserver promise pour initialiser CDN
}

export async function chargerSiteConfiguration(url) {
  const reponse = await getUrl(url, {noverif: true})
  const siteConfiguration = reponse.data
  await setSiteConfiguration(siteConfiguration)
  return siteConfiguration
}

export async function getUrl(url, opts) {
  opts = opts || {}
  const cdn = opts.cdn || {}

  if(url.endsWith('.json') && ['awss3'].includes(cdn.type_cdn)) {
    url = url + '.gz'
  }

  var responseType = opts.responseType
  if(responseType === 'json.gzip') {
    // On va decoder le fichier et le parser
    responseType = 'blob'
  }

  const reponse = await axios({
    method: 'get',
    url,
    timeout: opts.timeout || 30000,
    responseType,
  })

  var data = reponse.data
  if(opts.responseType === 'json.gzip') {
    // Extraire le resultat et transformer en dict
    const responseStr = await unzipResponse(data)
    data = JSON.parse(responseStr)
  }

  if(!opts.noverif) {
    // Verifier la signature de la ressource
    let signatureValide = await verifierSignatureMessage(data, data._certificat, _certificateStore)
    if(!signatureValide) {
      throw new Error(`Signature {$url} invalide`)
    }
    // console.debug("Signature %s est valide", url)
  }

  return {status: reponse.status, data}
}

export async function getSection(uuidSection, typeSection) {
  if(!await _cdnCourant) throw new Error("Aucun CDN n'est disponible")

  const typeCdn = _cdnCourant.config.type_cdn
  var urlComplet, opts = {}
  if(typeCdn === 'ipfs') {
    const ipnsMapping = _siteConfiguration.ipns_map
    console.debug("IPNS map : %O", ipnsMapping)
    if(ipnsMapping) {
      const ipns_id = ipnsMapping[uuidSection]
      urlComplet = 'ipns://' + ipns_id
      opts.timeout = 120000
      opts.responseType = 'json.gzip'
    } else {
      console.warn("IPNS map de sactions n'est pas disponible dans _siteConfiguration")
    }
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
    urlComplet = accessPointUrl + urlRessource
  }

  return getUrl(urlComplet, {...opts, cdn: _cdnCourant.config})
}

export async function resolveUrlFuuid(fuuid, fuuidInfo) {
  if(!_cdnCourant) throw new Error("Aucun CDN n'est disponible")
  const mimetype = fuuidInfo.mimetype

  const typeCdn = _cdnCourant.config.type_cdn
  if(typeCdn === 'ipfs') {
    if(fuuidInfo.cid) {
      return 'ipfs://' + fuuidInfo.cid
    } else {
      console.warn("FUUID %s, aucun CID defini pour IPFS", fuuid)
    }
  } else if(typeCdn === 'ipfs_gateway') {

  } else if(typeCdn === 'awss3') {
    const accessPointUrl = _cdnCourant.config.access_point_url
    const ext = mimetypeExtensions[mimetype]
    const pathFuuid = path.join('fichiers/public', fuuid + '.' + ext)
    const urlRessource = accessPointUrl + '/' + pathFuuid
    return urlRessource
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

async function verifierConnexionCdns(opts) {
  opts = opts || {}
  /* Parcours les CDN et trouve ceux qui sont actifs. */

  // Extraire CDN en ordre de preference de la configuration
  const cdnIds = _siteConfiguration.cdns.reduce((acc, item)=>{return [...acc, item.cdn_id]}, [])

  // Verifier la presence de path/index.json sur chaque CDN
  var promisesCdns = []
  for await (let cdnId of cdnIds) {
    const etatCdn = _etatCdns[cdnId]
    const typeCdn = etatCdn.config.type_cdn
    switch(typeCdn) {
      case 'sftp':
      case 'awss3':
      case 'ipfs_gateway':
        etatCdn.promiseCheck = verifierEtatAccessPoint(cdnId)
        break
      case 'ipfs':
        etatCdn.promiseCheck = verifierEtatIpfs(cdnId)
        break
      default:
        console.debug("Type CDN inconnu : %s", typeCdn)
    }
    promisesCdns.push(etatCdn.promiseCheck)
  }

  // Attendre le premier CDN qui revient (le plus rapide)
  var cdnCourant
  if(opts.initial) {
    // Sur connexion initiale, on prend la premiere connexion qui est prete
    cdnCourant = await Promise.any(promisesCdns)
  } else {
    const resultats = (await Promise.allSettled(promisesCdns))
      .filter(item=>item.status==='fulfilled')
      .map(item=>item.value)

    // Trouver un CDN dans la liste par ordre de preference du site
    for(let idx in resultats) {
      const etatCdn = resultats[idx]
      const etat = etatCdn.etat
      if(etat === ETAT_ACTIF) {
        cdnCourant = etatCdn
        break
      }
    }
  }

  console.debug("Etat CDNs : %O\nCDN courant %O", _etatCdns, cdnCourant)
  _cdnCourant = cdnCourant
  return cdnCourant
}

async function verifierEtatAccessPoint(cdnId) {
  const etatCdn = _etatCdns[cdnId],
        config = etatCdn.config

  const accessPointUrl = config.access_point_url
  var urlRessource = accessPointUrl + '/index.json'

  try {
    const dateDebut = new Date().getTime()
    const reponse = await getUrl(urlRessource, {cdn: config, timeout: 3000})
    const tempsReponse = new Date().getTime()-dateDebut
    etatCdn.etat = ETAT_ACTIF
    etatCdn.tempsReponse = tempsReponse
  } catch(err) {
    etatCdn.etat = ETAT_ERREUR
    etatCdn.tempsReponse = -1
    console.error("Erreur access point : %O\n%O", etatCdn, err)
    throw err
  }

  return etatCdn
}

async function verifierEtatIpfs(cdnId) {
  const etatCdn = _etatCdns[cdnId],
        config = etatCdn.config

  const ipnsId = _siteConfiguration.ipns_id
  if(ipnsId) {
    try {
      const url = "ipns://" + ipnsId
      console.debug("Verifier capacite d'acceder a IPFS directement avec %s", url)
      const dateDebut = new Date().getTime()
      const reponse = await axios({method: 'get', url, timeout: 120000})
      const tempsReponse = new Date().getTime()-dateDebut
      console.debug("Reponse via IPNS: %O", reponse)

      etatCdn.etat = ETAT_ACTIF
      etatCdn.tempsReponse = tempsReponse
    } catch(err) {
      etatCdn.etat = ETAT_ERREUR
      etatCdn.tempsReponse = -1
      console.error("Erreur access point : %O\n%O", etatCdn, err)
      throw err
    }
  }

  return etatCdn
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

function unzipResponse(blob) {
  // const buffer = Buffer.from(stringBuffer, 'raw')
  return new Promise(async (resolve, reject)=>{
    const abData = await blob.arrayBuffer()
    gunzip(new Uint8Array(abData), (err, buffer) => {
      if (err) {
        console.error('Unzip Response error occurred:', err)
        return reject(err)
      }
      console.log(buffer.toString())
      resolve(buffer.toString())
    })
  })
}
