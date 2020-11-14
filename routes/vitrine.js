const debug = require('debug')('millegrilles:vitrine:route');
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid')
const {chargerSites, chargerPosts} = require('../models/siteDao')
const {sauvegarderSites, sauvegarderPosts} = require('../models/filesystemDao')
const {extrairePostids, extraireCollectionsRecursif} = require('../models/siteModel')

// Generer mot de passe temporaire pour chiffrage des cookies
const secretCookiesPassword = uuidv4()

var idmg = null, proprietairePresent = null;

const noeudId = process.env.MG_NOEUD_ID
if(!noeudId) throw new Error("Il faut fournir MG_NOEUD_ID")

function initialiser(fctRabbitMQParIdmg, opts) {
  if(!opts) opts = {}
  const idmg = opts.idmg
  const amqpdao = fctRabbitMQParIdmg(idmg)

  debug("IDMG: %s, AMQPDAO : %s", idmg, amqpdao !== undefined)

  const route = express();

  route.use(cookieParser(secretCookiesPassword))

  // Fonctions sous /millegrilles/api
  route.get('/info.json', infoMillegrille)

  // Exposer le certificat de la MilleGrille (CA)
  route.use('/millegrille.pem', express.static(process.env.MG_MQ_CAFILE))
  route.use('/certificat.pem', express.static(process.env.MG_MQ_CERTFILE))

  ajouterStaticRoute(route)

  debug("Route /vitrine est initialisee")

  // Lancer chargement async des sites (si echec, va reessayer durant la maintenance)
  _chargerSites(amqpdao, noeudId)

  // Retourner dictionnaire avec route pour server.js
  return {route}
}

function ajouterStaticRoute(route) {
  var folderStatic =
    process.env.MG_VITRINE_STATIC_RES ||
    process.env.MG_STATIC_RES ||
    'static/vitrine'

  route.use(express.static(folderStatic))
}

async function infoMillegrille(req, res, next) {
  // Verifie si la MilleGrille est initialisee. Conserve le IDMG

  if( ! idmg ) {
    idmg = req.amqpdao.pki.idmg
  }

  const reponse = { idmg }

  res.send(reponse)
}

async function _chargerSites(amqpdao, noeudId) {
  const messageSites = await chargerSites(amqpdao, noeudId)
  await sauvegarderSites(noeudId, messageSites, amqpdao)

  // Extraire post ids
  const postIdMap = {}
  var toutesCollections = false,
      collectionIds = {}
  messageSites.liste_sites.forEach(site=>{
    const postIds = extrairePostids(site)
    debug("Post ids du site %s : %O", site.site_id, postIds)
    postIds.forEach(postId=>postIdMap[postId]=true)  // Conserver postIds et faire dedupe

    if( ! toutesCollections ) {
      const collectionsInfo = extraireCollectionsRecursif(site)
      if(collectionsInfo.toutesCollections) {
        toutesCollections = true
      } else {
        debug("Collections du site %s : %O", site.site_id, collectionsInfo)
        collectionsInfo.collections.forEach(id=>{collectionIds[id]=true})  // Conserver Ids, dedupe
      }
    }
  })

  const messagePosts = await chargerPosts(amqpdao, Object.keys(postIdMap))
  debug("Posts recus : %O", messagePosts)
  await sauvegarderPosts(messagePosts, amqpdao)

  if(toutesCollections) {
    debug("Charger toutes les collections publiques")
  } else {
    const collections = Object.keys(collectionIds)
    debug("Charger collections publiques : %O", collections)
  }

}

module.exports = {initialiser}
