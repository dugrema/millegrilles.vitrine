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

    // Conserver une liste de certificats connus, permet d'eviter la
    // sauvegarder redondante du meme certificat
    this.certificatsConnus = {};
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
        console.info("Connexion a RabbitMQ reussie");
        this.connection = conn;

        conn.on('close', (reason)=>{
          console.warn("Fermeture connexion RabbitMQ");
          console.info(reason);
          this.scheduleReconnect();
        });

        conn.on('error', (reason)=>{
          console.error("Fermeture connexion RabbitMQ sur erreur");
          console.info(reason);
          this.scheduleReconnect();
        });

        return conn.createChannel();
      }).then( (ch) => {
        this.channel = ch;
        // console.debug("Channel ouvert");
        ch.prefetch(5);
        return this.ecouter();
      }).then(()=>{
        this.routingKeyManager.enregsitrerApresConnexion();
        // console.log("Routing Keys reassociee a Q");

        // Transmettre le certificat
        let fingerprint = this.transmettreCertificat();

        // Enregistrer routing key du certificat
        // Permet de repondre si un autre composant demande notre certificat
        this.routingKeyCertificat = 'pki.requete.' + fingerprint;
        // console.debug("Enregistrer routing key: " + fingerprint)
        this.channel.bindQueue(this.reply_q.queue, NOM_EXCHANGE, this.routingKeyCertificat);

        console.log("Connexion et channel prets");
      }).catch(err => {
        this.connection = null;
        console.error("Erreur connexion a RabbitMQ");
        // console.error(err);
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
        // console.debug("Reconnexion en cours");
        mq.reconnectTimeout = null;
        mq._connect();
      }, dureeAttente*1000);

      // console.info("Reconnexion a MQ dans " + dureeAttente + " secondes");

      var conn = this.connection, channel = this.channel;
      this.connection = null;
      this.channel = null;

      if(channel) {
        try {
          channel.close();
        } catch (err) {
          console.info("Erreur fermeture channel");
          // console.debug(err);
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
        // console.debug("Queue reponse globale cree"),
        // console.log(q);
        this.reply_q = q;

        this.channel.consume(
          q.queue,
          (msg) => {this._traiterMessage(msg);},
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

  async _traiterMessage(msg) {
    // const noMessage = this.compteurMessages;
    // this.compteurMessages = noMessage + 1;

    // console.debug("Message recu " + noMessage);
    let correlationId = msg.properties.correlationId;
    let callback = this.pendingResponses[correlationId];
    if(callback) {
      delete this.pendingResponses[correlationId];
    }

    // let messageContent = decodeURIComponent(escape(msg.content));
    let messageContent = msg.content.toString();
    let routingKey = msg.fields.routingKey;
    let json_message = JSON.parse(messageContent);
    // console.debug(json_message);

    if(routingKey && routingKey.startsWith('pki.certificat.')) {
      // Sauvegarder le certificat localement pour usage futur
      pki.sauvegarderMessageCertificat(messageContent, json_message.fingerprint);
      return; // Ce message ne correspond pas au format standard
    } else if(routingKey === this.routingKeyCertificat) {
      this.transmettreCertificat();
      return;
    }

    // Valider le contenu du message - hachage et signature
    let hashTransactionCalcule = pki.hacherTransaction(json_message);
    let hashTransactionRecu = json_message['en-tete']['hachage-contenu'];
    if(hashTransactionCalcule !== hashTransactionRecu) {
      console.warn("Erreur hachage incorrect : " + hashTransactionCalcule + ", message dropped");
      // console.debug(messageContent);

      return;
    }

    return pki.verifierSignatureMessage(json_message)
    .then(signatureValide=>{
      if(signatureValide) {
        // console.debug("Message valide");
        return this.traiterMessageValide(json_message, msg, callback);
      } else {
        // Cleanup au besoin
        console.error("Signature message invalide");
        delete this.pendingResponses[correlationId];
      }
    })
    .catch(err=>{
      if(err.inconnu) {
        // Message inconnu, on va verifier si c'est une reponse de
        // certificat.
        if(json_message.resultats && json_message.resultats.certificat_pem) {
          // On laisse le message passer, c'est un certificat
          // console.debug("Certificat recu");
          callback(msg);
        } else {
          // On tente de charger le certificat
          let fingerprint = json_message['en-tete'].certificat;
          console.warn("Certificat inconnu, on fait une demande : " + fingerprint);

          return this.demanderCertificat(fingerprint)
          .then(reponse=>{
            // console.debug("Reponse demande certificat " + fingerprint);
            // console.debug(reponse);

            var etatCertificat = this.certificatsConnus[fingerprint];

            if(!etatCertificat) {

              // Creer un placeholder pour messages en attente sur ce
              // certificat.
              etatCertificat = {
                reponse: reponse.resultats,
                certificatSauvegarde: false,
                callbacks: [],
                timer: setTimeout(()=>{
                  console.error("Timeout traitement certificat " + fingerprint);
                  // Supprimer attente, va essayer a nouveau plus tard
                  delete this.certificatsConnus[fingerprint];
                }, 10000),
              }

              this.certificatsConnus[fingerprint] = etatCertificat;

              // Sauvegarder le certificat et tenter de valider le message en attente
              pki.sauvegarderMessageCertificat(JSON.stringify(reponse.resultats))
              .then(()=>pki.verifierSignatureMessage(json_message))
              .then(signatureValide=>{
                if(signatureValide) {
                  return this.traiterMessageValide(json_message, msg, callback);
                  clearTimeout(etatCertificat.timer);

                  etatCertificat.certificatSauvegarde = true;

                  while(etatCertificat.callbacks.length > 0) {
                    const callbackMessage = this.certificatsConnus[fingerprint].callbacks.pop();
                    try {
                      // console.debug("Callback apres reception certificat " + fingerprint);
                      callbackMessage();
                    } catch (err) {
                      console.error("Erreur callback certificat " + fingerprint);
                    }
                  }

                  // Cleanup memoire
                  this.certificatsConnus[fingerprint] = {certificatSauvegarde: true};

                } else {
                  console.warn("Signature invalide, message dropped");
                }
              })
              .catch(err=>{
                console.warn("Message non valide apres reception du certificat, message dropped");
                console.info(err);
              });

            } else {

              if(etatCertificat.certificatSauvegarde) {
                return this.traiterMessageValide(json_message, msg, callback);
              } else {
                // Inserer callback a executer lors de la reception du certificat
                etatCertificat.callbacks.push(
                  () => {return this.traiterMessageValide(json_message, msg, callback);}
                );
              }
            };

          })
          .catch(err=>{
            console.warn("Certificat non charge, message dropped");
            console.info(err);
          })
        }
      }
    });
  }

  // Valide une signature. Demande le certificat s'il est inconnu.
  async validerSignature(json_message) {
    var signatureValide = false;

    try {
      signatureValide = await pki.verifierSignatureMessage(json_message)
      // console.debug("Signature valide ? " + signatureValide);
    } catch (err) {
      // console.error("Erreur validation signature");
      // console.error(err);
      if(err.inconnu) {
        // console.error("Certificat inconnu");
        // Message inconnu, on va verifier si c'est une reponse de
        // certificat.
        if(json_message.resultats && json_message.resultats.certificat_pem) {
          signatureValide = true;
        } else {
          let fingerprint = json_message['en-tete'].certificat;
          console.warn("Certificat inconnu, on fait une demande : " + fingerprint);
          try {
            // Demander le certificat inconnu
            let reponseCertificat = await this.demanderCertificat(fingerprint);
            var reponseJson = JSON.stringify(reponseCertificat.resultats);
            // console.debug("Reponse certificat : " + reponseJson);
            await pki.sauvegarderMessageCertificat(reponseJson);

            // Refaire la validation de la signature avec le certificat recu
            signatureValide = await pki.verifierSignatureMessage(json_message);
          } catch (err2) {
            console.warn("Certificat ne peut pas etre charge : " + fingerprint);
          }
        }
      }
    }

    return signatureValide;
  }

  traiterMessageValide(json_message, msg, callback) {
    let routingKey = msg.fields.routingKey;
    if(callback) {
      callback(json_message);
    } else if(routingKey) {
      // console.debug(`Message sur routing ${routingKey}`);
      this.routingKeyManager.emitMessage(routingKey, json_message);
    } else {
      console.warn("Recu message sans correlation Id ou routing key");
      console.warn(msg);
    }

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

  demanderCertificat(fingerprint) {
    var requete = {fingerprint}
    var routingKey = 'requete.millegrilles.domaines.Pki.certificat';
    return this.transmettreRequete(routingKey, requete)
    .then(reponse=>{
      let messageContent = decodeURIComponent(escape(reponse.content));
      let json_message = JSON.parse(messageContent);
      console.info(`Reception certificat ${json_message.resultats.fingerprint}`);
      return json_message;
    })
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
    // this.registeredRoutingKeysForSockets = {};
    this.registeredRoutingKeysForNamespaces = {};
  }

  setWebSocketsManager(manager) {
    this.websocketsManager = manager;
    // console.log("WebSocketsManager");
    // console.log(this.websocketsManager);
  }

  addRoutingKeyForNamespace(namespace, routingKeys) {
    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      var namespace_list = this.registeredRoutingKeysForNamespaces[routingKeyName];
      if(!namespace_list) {
        namespace_list = [];
        this.registeredRoutingKeysForNamespaces[routingKeyName] = namespace_list;
      }
      namespace_list.push(namespace);

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
  }

  emitMessage(routingKey, json_message) {
    // let messageContent = decodeURIComponent(escape(message.content));
    // let json_message = JSON.parse(message);

    // Emettre sur namespaces (specifiques au domaine)
    let listeNamespaces = this.registeredRoutingKeysForNamespaces[routingKey];
    for(let idx in listeNamespaces) {
      let namespace = listeNamespaces[idx];
      // console.debug("Emission vers namespace  " + namespace.name + " pour " + routingKey);
      // console.debug(namespace);
      namespace.emit('mq_message', {routingKey, message: json_message});
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
