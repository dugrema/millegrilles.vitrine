const debug = require('debug')('millegrilles:vitrine:route');
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const { chargerSites, chargerSections } = require('../models/siteDao')
const { configurationEvenements } = require('../models/appSocketIo')
// const { listerCollections } = require('../models/filesystemDao')

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

  // route.use(cookieParser(secretCookiesPassword))
  //
  // // Fonctions sous /vitrine
  // route.get('/index.json', infoSite)
  //
  // // Exposer le certificat de la MilleGrille (CA)
  // route.use('/millegrille.pem', express.static(process.env.MG_MQ_CAFILE))
  // route.use('/certificat.pem', express.static(process.env.MG_MQ_CERTFILE))

  ajouterStaticRoute(route)

  debug("Route /vitrine est initialisee")

  // Lancer chargement async des sites (si echec, va reessayer durant la maintenance)
  Promise.all([
    chargerSites(amqpdao, noeudId),
    chargerSections(amqpdao, noeudId)
  ]).catch(err=>{
    console.error("Erreurs chargements site/sections: %O", err)
  })

  function middlewareSocketio(socket, next) {
    debug("Middleware vitrine socket.io")
    next()
  }
  const socketio = {middleware: middlewareSocketio, configurationEvenements}

  // Retourner dictionnaire avec route pour server.js
  return {route, socketio}
}

function ajouterStaticRoute(route) {

  // Exposer path ressources statiques (e.g. client React)
  var folderStatic =
    process.env.MG_VITRINE_STATIC_RES ||
    process.env.MG_STATIC_RES ||
    'static/vitrine'
  route.use(express.static(folderStatic))

  // Exposer path data - noter que NGINX devrait intercepter ce path en production
  const pathData = '/var/opt/millegrilles/nginx/data' || process.env.MG_VITRINE_DATA
  const pathDataVitrine = path.join(pathData, 'vitrine')
  route.use(express.static(pathDataVitrine))

}

// async function infoSite(req, res, next) {
//   // Verifie si la MilleGrille est initialisee. Conserve le IDMG
//
//   const amqpdao = req.amqpdao
//
//   if( ! idmg ) {
//     idmg = amqpdao.pki.idmg
//   }
//
//   var reponse = { idmg }
//   reponse = await amqpdao.pki.formatterMessage(reponse, 'Vitrine.information', {attacherCertificat: true})
//
//   res.send(reponse)
// }
//
// async function listeCollections(req, res) {
//   // Charger la liste des collections, retourner sous un meme stream
//   const collections = await listerCollections()
//   const reponse = {
//     liste_collections: collections,
//   }
//
//   const amqpdao = req.amqpdao
//   amqpdao.formatterTransaction('Vitrine.listeCollections', reponse, {attacherCertificat: true})
//
//   res.status(200).send(reponse)
// }

module.exports = {initialiser}
