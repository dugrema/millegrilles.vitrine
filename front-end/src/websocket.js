// Vitrine web socket handler vers l'api de Vitrine (Express WSS)
import openSocket from 'socket.io-client';

export class VitrineWebSocketHandler {
  constructor() {
    this.socket = null;
    this.routingKeyCallbacks = {};
    this.gestionEvenements = new GestionEvenements();

    // Bind methodes avec this
    this.reconnecter = this.reconnecter.bind(this);
  }

  connecter() {
    let socket = openSocket('/', {reconnection: true});
    this.socket = socket;
    this._enregistrerEvenements();
    this._enregistrerListeners();
  }

  reconnecter() {
    this._enregistrerListeners();  // Retransmettre listeners courants a l'API
  }

  _enregistrerEvenements() {
    // Enregistre les evenements sur le socket
    this.socket.on('disconnect', this.gestionEvenements.deconnexion);
    this.socket.on('reconnect', this.reconnecter);

    this.socket.on('mq_message', this.gestionEvenements.traiterMessageMq);
  }

  _enregistrerListeners() {
    // Transmet a l'API les evenements qui nous interesse (specialement MQ)
    let routingKeys = Object.keys(this.routingKeyCallbacks);
    this.socket.emit('subscribe', {routingKeys});
  }

  subscribe(routingKeys, callback) {
    // Transmet une liste de routingKeys a enregistrer sur notre Q.
    console.debug("Ajout routingKeys:");
    console.debug(routingKeys);
    this.socket.emit('subscribe', {routingKeys});

    for(var key_id in routingKeys) {
      let routingKey = routingKeys[key_id];

      var dictCallback = this.routingKeyCallbacks[routingKey];
      if(!dictCallback) {
        this.routingKeyCallbacks[routingKey] = callback;
      } else {
        console.warn("Changement de callback pour " + routingKey);
        this.routingKeyCallbacks[routingKey] = callback;
      }
    }
  }

  unsubscribe(routingKeys, callback) {
    // Transmet une liste de routingKeys a retirer de la Q cote serveur.
    this.socket.emit('unsubscribe', {routingKeys});

    for(var key_id in routingKeys) {
      let routingKey = routingKeys[key_id];
      delete this.routingKeyCallbacks[routingKey];
    }

  }

}

class GestionEvenements {

  // constructor() {
  // }

  deconnexion() {
    console.error("WSS Vitrine Deconnecte");
  }

  traiterMessageMq(enveloppe) {
    let {routingKey, message} = enveloppe;
    console.log("MQ Message recu: " + routingKey);
    console.log(message);
    // this.traiterMessageMq(routingKey, message);
  }

}
