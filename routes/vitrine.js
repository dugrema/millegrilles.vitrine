const debug = require('debug')('millegrilles:vitrine:route')
const express = require('express')

const {WebSocketVitrineApp} = require('../models/reactwss')

const _info = {
  nodeId: 'DUMMY_CHANGE_MOI',
  modeHebergement: false,
}

var _fctRabbitMQParIdmg = null

function initialiser(fctRabbitMQParIdmg, opts) {
  if(!opts) opts = {}

  _fctRabbitMQParIdmg = fctRabbitMQParIdmg

  if(opts.idmg) {
    // Pour mode sans hebergement, on conserve le IDMG de reference local
    const idmg = opts.idmg
    _info.idmg = idmg
  } else {
    // Pas d'IDMG de reference, on est en mode hebergement
    _info.modeHebergement = true
  }

  const app = express();

  // Ajouter route pour application React
  ajouterStaticRoute(app)

  // catch 404
  app.use(function(req, res, next) {
    res.status(404);
    res.end()
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.error(" ************** Unhandled error begin ************** ");
    console.error(err);
    console.error(" ************** Unhandled error end   ************** ");

    res.status(err.status || 500);
    res.end()
  });

  // Retourner hooks pour la configuration de la route
  return {route: app, socketio: {configurerServer: configurerSocketIO}}
}

function ajouterStaticRoute(route) {
  var folderStatic =
    process.env.MG_COUPDOEIL_STATIC_RES ||
    'static/vitrine'

  debug("Folder static pour vitrine : %s", folderStatic)

  route.use(express.static(folderStatic))
}

function configurerSocketIO(server) {
  const amqpdao = _fctRabbitMQParIdmg(_info.idmg)
  const nodeId = _info.nodeId
  const vitrineSocketIO = new WebSocketVitrineApp(server, amqpdao, nodeId)
  vitrineSocketIO.initialiserDomaines()
}

function routeInfo(req, res, next) {

  const reponse = JSON.stringify(_info);
  res.setHeader('Content-Type', 'application/json');
  res.end(reponse);

};

module.exports = {initialiser};
