var amqplib = require('amqplib');
var os = require('os');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var pki = require('./pki.js');

const NOM_EXCHANGE = 'millegrilles.public';

class RabbitMQWrapper {

  constructor() {
    this.idmg = process.env.MG_IDMG;
    this.url = null;
    this.connection = null;
    this.channel = null;
    this.reply_q = null;

    this.reconnectTimeout = null; // Timer de reconnexion - null si inactif

    // Correlation avec les reponses en attente.
    // Cle: uuid de CorrelationId
    // Valeur: callback
    this.pendingResponses = {};

    // this.nomMilleGrille = this._trouverNomMilleGrille()
    // this.setHostname();

    this.routingKeyManager = new RoutingKeyManager(this);
    this.routingKeyCertificat = null;

  }

  connect(url) {
    this.url = url;
    return this._connect();
  }

  _connect() {

    let mq_cacert = process.env.MG_MQ_CAFILE,
        mq_cert = process.env.MG_MQ_CERTFILE,
        mq_key = process.env.MG_MQ_KEYFILE;

    if(this.connection === null) {
      let options = {}
      if(mq_cacert !== undefined) {
        var cacert = fs.readFileSync(mq_cacert);
        options['ca'] = [cacert];
      }
      if(mq_cert !== undefined) {
        var cert = fs.readFileSync(mq_cert);
        options['cert'] = cert;
      }
      if(mq_key !== undefined) {
        var key = fs.readFileSync(mq_key);
        options['key'] = key;
      }
      options['credentials'] = amqplib.credentials.external();

      return amqplib.connect(this.url, options)
      .then( conn => {
        console.debug("Connexion a RabbitMQ reussie");
        this.connection = conn;

        conn.on('close', (reason)=>{
          console.warn("Fermeture connexion RabbitMQ");
          console.info(reason);
          this.scheduleReconnect();
        });

        return conn.createChannel();
      }).then( (ch) => {
        this.channel = ch;
        console.debug("Channel ouvert");
        return this.ecouter();
      }).then(()=>{
        console.debug("Connexion et channel prets");

        this.routingKeyManager.enregsitrerApresConnexion();
        console.log("Routing Keys reassociee a Q");

        // Transmettre le certificat
        let fingerprint = this.transmettreCertificat();

        // Enregistrer routing key du certificat
        // Permet de repondre si un autre composant demande notre certificat
        this.routingKeyCertificat = 'pki.requete.' + fingerprint;
        console.debug("Enregistrer routing key: " + fingerprint)
        this.channel.bindQueue(this.reply_q.queue, NOM_EXCHANGE, this.routingKeyCertificat);

        // console.debug("Certificat transmis");
      }).catch(err => {
        this.connection = null;
        console.error("Erreur connexion RabbitMQ");
        console.error(err);
        this.scheduleReconnect();
      });

    }

  }

  scheduleReconnect() {
    // Met un timer pour se reconnecter
    const dureeAttente = 30;

    if(!this.reconnectTimeout) {
      var mq = this;
      this.reconnectTimeout = setTimeout(()=>{
        console.debug("Reconnexion en cours");
        mq.reconnectTimeout = null;
        mq._connect();
      }, dureeAttente*1000);

      console.info("Reconnexion a MQ dans " + dureeAttente + " secondes");

      var conn = this.connection, channel = this.channel;
      this.connection = null;
      this.channel = null;

      if(channel) {
        try {
          channel.close();
        } catch (err) {
          console.debug("Erreur fermeture channel");
          console.debug(err);
        }
      }

      if(this.connection) {
        try {
          conn.close();
        } catch (err) {
          console.info("Erreur fermeture connection");
          console.info(err);
        }
      }
    }
  }

  ecouter() {

    let promise = new Promise((resolve, reject) => {

      // Creer Q pour ecouter
      this.channel.assertQueue('', {
        durable: false,
        exclusive: true,
      })
      .then( (q) => {
        console.debug("Queue reponse globale cree"),
        // console.log(q);
        this.reply_q = q;

        this.channel.consume(
          q.queue,
          (msg) => {
            // console.log('1. Message recu');
            let correlationId = msg.properties.correlationId;
            let messageContent = msg.content.toString('utf-8');
            let routingKey = msg.fields.routingKey;

            if(correlationId) {
              let callback = this.pendingResponses[correlationId];
              if(callback) {
                callback(msg);
              }
            } else if(routingKey) {
              if(routingKey === this.routingKeyCertificat) {
                this.transmettreCertificat();
              } else {
                console.debug("Message avec routing key: " + routingKey);
                this.routingKeyManager.emitMessage(routingKey, messageContent);
              }
            } else {
              console.debug("Recu message sans correlation Id ou routing key");
              console.warn(msg);
            }
          },
          {noAck: true}
        );

        resolve();
      })
      .catch( err => {
        console.error("Erreur creation Q pour ecouter");
        reject(err);
      })
    });

    return promise;

  }

  transmettreCertificat() {
    let messageCertificat = pki.preparerMessageCertificat();
    let fingerprint = messageCertificat.fingerprint;
    let messageJSONStr = JSON.stringify(messageCertificat);
    this._publish(
      'pki.certificat.' + fingerprint, messageJSONStr
    );

    return fingerprint;
  }

  // Utiliser cette methode pour simplifier le formattage d'une transaction.
  // Il faut fournir le contenu de la transaction et le domaine (routing)
  transmettreTransactionFormattee(message, domaine) {
    let messageFormatte = message;  // Meme objet si ca cause pas de problemes
    let infoTransaction = this._formatterInfoTransaction(domaine);
    const correlation = infoTransaction['uuid-transaction'];
    messageFormatte['en-tete'] = infoTransaction;

    // Signer le message avec le certificat
    this._signerMessage(messageFormatte);
    const jsonMessage = JSON.stringify(message);

    // Transmettre la nouvelle transaction. La promise permet de traiter
    // le message de reponse.
    let routingKey = 'transaction.nouvelle';
    let promise = this._transmettre(routingKey, jsonMessage, correlation);

    return promise;
  }

  _formatterInfoTransaction(domaine) {
    // Ces valeurs n'ont de sens que sur le serveur.
    // Calculer secondes UTC (getTime retourne millisecondes locales)
    let dateUTC = (new Date().getTime()/1000) + new Date().getTimezoneOffset()*60;
    let tempsLecture = Math.trunc(dateUTC);
    let infoTransaction = {
      'domaine': domaine,
      'idmg': this.idmg,
      'uuid-transaction': uuidv4(),
      'estampille': tempsLecture,
      'certificat': pki.getFingerprint(),
      'hachage-contenu': '',  // Doit etre calcule a partir du contenu
      'version': 6
    };

    return infoTransaction;
  }

  _signerMessage(message) {
    // Produire le hachage du contenu avant de signer - le hash doit
    // etre inclus dans l'entete pour faire partie de la signature.
    let hachage = pki.hacherTransaction(message);
    message['en-tete']['hachage-contenu'] = hachage;

    // Signer la transaction. Ajoute l'information du certificat dans l'entete.
    let signature = pki.signerTransaction(message);
    message['_signature'] = signature;
  }

  // Methode qui permet de transmettre une transaction au backend RabbitMQ
  // Les metadonnees sont ajoutees automatiquement
  _transmettreTransaction(routingKey, message) {
    let jsonMessage = JSON.stringify(message);

    // Le code doit uniquement etre execute sur le serveur
    // console.log("Message: routing=" + routingKey + " message=" + jsonMessage);
    try {
      // console.log("Message a transmettre: " + routingKey + " = " + jsonMessage);
      this.channel.publish(
        NOM_EXCHANGE,
        routingKey,
         new Buffer(jsonMessage),
         {
           correlationId: message['correlation'],
           replyTo: this.reply_q.queue,
         },
         function(err, ok) {
           console.error("Erreur MQ Callback");
           console.error(err);
         }
      );
    }
    catch (e) {
      console.error("Erreur MQ");
      console.error(e);
      this.reconnect(); // Tenter de se reconnecter
    }
  }

  transmettreRequete(routingKey, message) {

    const infoTransaction = this._formatterInfoTransaction(routingKey);

    message['en-tete'] = infoTransaction;
    this._signerMessage(message);

    const correlation = infoTransaction['uuid-transaction'];
    const jsonMessage = JSON.stringify(message);

    // Transmettre requete - la promise permet de traiter la reponse
    const promise = this._transmettre(routingKey, jsonMessage, correlation);
    return promise;
  }

  _transmettre(routingKey, jsonMessage, correlationId) {
    // Setup variables pour timeout, callback
    let timeout, fonction_callback;

    let promise = new Promise((resolve, reject) => {

      var processed = false;
      const pendingResponses = this.pendingResponses;
      fonction_callback = function(msg, err) {
        // Cleanup du callback
        delete pendingResponses[correlationId];
        clearTimeout(timeout);

        if(msg && !err) {
          resolve(msg);
        } else {
          reject(err);
        }
      };

      // Exporter la fonction de callback dans l'objet RabbitMQ.
      // Permet de faire la correlation lorsqu'on recoit la reponse.
      pendingResponses[correlationId] = fonction_callback;

      // Faire la publication
      this.channel.publish(
        NOM_EXCHANGE,
        routingKey,
        Buffer.from(jsonMessage),
        {
          correlationId: correlationId,
          replyTo: this.reply_q.queue,
        },
        function(err, ok) {
          console.error("Erreur MQ Callback");
          console.error(err);
          delete pendingResponses[correlationId];
          reject(err);
        }
      );

    });

    // Lancer un timer pour permettre d'eviter qu'une requete ne soit
    // jamais nettoyee ou repondue.
    timeout = setTimeout(
      () => {fonction_callback(null, {'err': 'mq.timeout'})},
      15000
    );

    return promise;
  };

  _publish(routingKey, jsonMessage) {
    // Faire la publication
    let promise = this.channel.publish(
      NOM_EXCHANGE,
      routingKey,
      Buffer.from(jsonMessage),
      (err, ok) => {
        console.error("Erreur MQ Callback");
        console.error(err);
        if(correlationId) {
          delete pendingResponses[correlationId];
        }
      }
    );

    return promise;
  }

  // Retourne un document en fonction d'un domaine
  get_document(domaine, filtre) {
    // Verifier que la MilleGrille n'a pas deja d'empreinte usager
    let requete = {
      "requetes": [
        {
          "filtre": filtre
        }
      ]
    }
    let promise = this.transmettreRequete(
      'requete.' + domaine,
      requete
    )
    .then((msg) => {
      let messageContent = decodeURIComponent(escape(msg.content));
      let json_message = JSON.parse(messageContent);
      // console.log("JSON Message!\n\n\n");
      // console.log(json_message);
      let document_recu = json_message['resultats'][0][0];
      // console.log("Resultats!\n\n\n");
      // console.log(document_recu);
      return(document_recu);
    })

    return promise;
  }

}

class RoutingKeyManager {

  constructor(mq) {

    // Lien vers RabbitMQ, donne acces au channel, Q et routing keys
    this.mq = mq;
    this.websocketsManager = null;

    // Dictionnaire de routing keys
    //   cle: string (routing key sur RabbitMQ)
    //   valeur: dict de socket ids / socket
    this.registeredRoutingKeysForSockets = {};
    this.registeredRoutingKeysForNamespaces = {};
  }

  setWebSocketsManager(manager) {
    this.websocketsManager = manager;
    // console.log("WebSocketsManager");
    // console.log(this.websocketsManager);
  }

  addRoutingKeysForSocket(socket, routingKeys) {
    const socketId = socket.id;
    // console.debug("Ajouter routingKeys au socket " + socketId);
    // console.debug(routingKeys);

    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      // Ajouter la routing key
      this.mq.channel.bindQueue(this.mq.reply_q.queue, NOM_EXCHANGE, routingKeyName);

      var socket_dict = this.registeredRoutingKeysForSockets[routingKeyName];
      if(!socket_dict) {
        socket_dict = {};
        this.registeredRoutingKeysForSockets[routingKeyName] = socket_dict;
      }
      socket_dict[socketId] = {'registered': (new Date()).getTime()};
    }
  }

  addRoutingKeyForNamespace(namespace, routingKeys) {
    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      var socket_list = this.registeredRoutingKeysForNamespaces[routingKeyName];
      if(!socket_list) {
        socket_list = [];
        this.registeredRoutingKeysForNamespaces[routingKeyName] = socket_list;
      }
      socket_list.push(namespace);

      // Ajouter la routing key
      try {
        this.mq.channel.bindQueue(this.mq.reply_q.queue, NOM_EXCHANGE, routingKeyName);
      } catch (err) {
        console.warn("Erreur enregistrement namespace sur routing key " + routingKeyName);
      }
    }
  }

  enregsitrerApresConnexion() {
    // Permet de re-enregistrer les routingKeys apres une re-connexion a MQ
    if(this.registeredRoutingKeysForNamespaces) {
      for(var routingKey in this.registeredRoutingKeysForNamespaces) {
        this.mq.channel.bindQueue(this.mq.reply_q.queue, NOM_EXCHANGE, routingKey);
      }
    }

    if(this.registeredRoutingKeysForSockets) {
      for(var routingKey in this.registeredRoutingKeysForSockets) {
        this.mq.channel.bindQueue(this.mq.reply_q.queue, NOM_EXCHANGE, routingKey);
      }
    }
  }

  removeRoutingKeysForSocket(socket, routingKeys) {
    // console.debug("Enlever routingKeys du socket " + socket.id);
    // console.debug(routingKeys);

    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      // Retirer la routing key
      this.mq.channel.unbindQueue(this.mq.reply_q.queue, NOM_EXCHANGE, routingKeyName);
    }
  }

  emitMessage(routingKey, message) {
    // let messageContent = decodeURIComponent(escape(message.content));
    let json_message = JSON.parse(message);

    // Emettre sur namespaces (specifiques au domaine)
    let listeNamespaces = this.registeredRoutingKeysForNamespaces[routingKey];
    for(let idx in listeNamespaces) {
      let namespace = listeNamespaces[idx];
      console.debug("Emission vers namespace  " + namespace.name + " pour " + routingKey);
      // console.debug(namespace);
      namespace.emit('mq_message', {routingKey, message: json_message});
    }

    // Transmet un message aux subscribers appropries
    var dictSockets = this.registeredRoutingKeysForSockets[routingKey];
    if(dictSockets && this.websocketsManager) {

      let cleanupSockets = [];
      for(var socketId in dictSockets) {
        let socket = this.websocketsManager.authenticated_sockets[socketId];
        if(socket) {
          // console.debug("Transmission message " + routingKey + " vers " + socket.id);
          socket.emit('mq_message', {routingKey: routingKey, message: json_message});
        } else {
          console.warn("Message not sent to socket " + socketId + ", socket gone.");
          cleanupSockets.push(socketId);
        }
      }

      for(var socketId in cleanupSockets) {
        delete dictSockets[cleanupSockets[socketId]];
      }
    }
  }

  clean() {
    // Verifier chaque routing key pour voir s'il reste au moins un
    // socket actif.

    // Enlever la routing key qui n'est plus utile.

  }

}

const rabbitMQ = new RabbitMQWrapper();

module.exports = rabbitMQ;
