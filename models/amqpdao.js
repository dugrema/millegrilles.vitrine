const debug = require('debug')('millegrilles:vitrine:amqpdao')
const fs = require('fs')
const {MilleGrillesPKI, MilleGrillesAmqpDAO} = require('@dugrema/millegrilles.common')

async function init() {

  // Preparer certificats
  const certPem = fs.readFileSync(process.env.MG_MQ_CERTFILE).toString('utf-8')
  const keyPem = fs.readFileSync(process.env.MG_MQ_KEYFILE).toString('utf-8')
  const certMillegrillePem = fs.readFileSync(process.env.MG_MQ_CAFILE).toString('utf-8')

  // Charger certificats, PKI
  const certPems = {
    millegrille: certMillegrillePem,
    cert: certPem,
    key: keyPem,
  }

  // Charger PKI
  const instPki = new MilleGrillesPKI()
  instPki.chargerPEMs(certPems)

  // Connecter a MilleGrilles avec AMQP DAO
  const amqpdao = new MilleGrillesAmqpDAO(instPki, {exchange: '1.public'})
  const mqConnectionUrl = process.env.MG_MQ_URL,
        noeudId = process.env.MG_NOEUD_ID
  await amqpdao.connect(mqConnectionUrl)

  initialiserRoutingKeys(amqpdao, noeudId)

  // Middleware, injecte l'instance
  const middleware = (req, res, next) => {
    req.amqpdao = amqpdao
    next()
  }

  return {middleware, amqpdao}
}

async function initialiserRoutingKeys(rabbitMQ, noeudId) {
  // Creer objets de connexion a MQ - importer librairies requises
  const {SiteMessageHandler} = require('./siteMessageHandler');
  rabbitMQ.enregistrerListenerConnexion(new SiteMessageHandler(rabbitMQ, noeudId));

  return {rabbitMQ};
}

module.exports = {init}
