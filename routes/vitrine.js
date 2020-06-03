const debug = require('debug')('millegrilles:vitrine:route')
const express = require('express')

const _info = {
  modeHebergement: false,
};

// const {WebSocketVitrineApp} = require('../websocket/reactwss')
//  vitrineWss.initialiserDomaines();
//  vitrineWss.initialiserDomaines(true);


function initialiser(fctRabbitMQParIdmg, opts) {
  if(!opts) opts = {}

  if(opts.idmg) {
    // Pour mode sans hebergement, on conserve le IDMG de reference local
    _info.idmg = opts.idmg
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

  // Ajouter parametres pour Socket.IO
  const socketio = {addSocket}

  return {route: app, socketio}
}

function ajouterStaticRoute(route) {
  var folderStatic =
    process.env.MG_COUPDOEIL_STATIC_RES ||
    'static/coupdoeil'

  debug("Folder static pour coupdoeil : %s", folderStatic)

  route.use(express.static(folderStatic))
}

// Fonction qui permet d'activer Socket.IO pour l'application
async function addSocket(socket) {
  // await _webSocketApp.addSocket(socket);
  debug("Socket ajoute : %s", socket.id)
}

function routeInfo(req, res, next) {

  const reponse = JSON.stringify(_info);
  res.setHeader('Content-Type', 'application/json');
  res.end(reponse);

};

module.exports = {initialiser};
