// WebSocket api pour l'application React Vitrine
const rabbitMQ = require('../util/rabbitMQ');

class WebSocketVitrineApp {

  constructor() {
    this.sockets = {}; // Liste des sockets geres par l'application
  }

  addSocket(socket) {
    // Ajoute un socket d'une nouvelle connexion
    // console.debug("Nouveau socket!");
    if(!socket.disconnected) {
      let socketResources = new WebSocketResources(socket);

      // S'assure que le socket n'a pas ete deconnecte avant d'ajouter
      // l'evenement de gestion du disconnect
      socket.on('disconnect', ()=>{
        this.disconnectedHandler(socket);
      });
      this.sockets[socket.id] = socketResources;
      console.debug("Connexion socket " + socket.id);
    }

  }

  disconnectedHandler(socket) {
    // console.debug("Socket deconnecte " + socket.id);

    let socketResources = this.sockets[socket.id];
    if(socketResources) {
      socketResources.close();
    }

    delete this.sockets[socket.id];

    console.debug("Nombre sockets ouverts: " + Object.keys(this.sockets).length);
  }

}

class WebSocketResources {

  constructor(socket) {
    this.socket = socket;
    this.subscriptions = {};  // Cle de message ecoute par ce socket

    this._enregistrerEvenements();

    // Bind this
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.resetSubscriptions = this.resetSubscriptions.bind(this);
  }

  subscribe(event) {
    console.debug("Subscribe");
    console.debug(event);
    for(let idx in event.routingKeys) {
      let routingKey = event.routingKeys[idx];
      this.subscriptions[routingKey] = true;
    }
  }

  unsubscribe(event) {
    console.debug("Unsubscribe");
    console.debug(event);
    for(let idx in event.routingKeys) {
      let routingKey = event.routingKeys[idx];
      if(this.subscriptions[routingKey]) {
        delete this.subscriptions[routingKey];
      }
    }
  }

  resetSubscriptions(event) {
    this.subscriptions = {};
  }

  _enregistrerEvenements() {
    this.socket.on('subscribe', event=>this.subscribe(event));
    this.socket.on('unsubscribe', event=>this.unsubscribe(event));
    this.socket.on('resetSubscriptions', event=>this.resetSubscriptions(event));
  }

  close() {
    console.debug("Deconnexion " + this.socket.id);
  }

}

module.exports = {WebSocketVitrineApp}
