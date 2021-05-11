const debug = require('debug')('millegrilles:vitrine:route');
const express = require('express')
const path = require('path')

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

function routeVitrine() {
  const route = express.Router()
  debug("vitrine.routeVitrine initialisee")

  ajouterStaticRoute(route)

  return route
}

module.exports = routeVitrine
