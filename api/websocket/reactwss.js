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
  }

}

class WebSocketResources {

  constructor(socket) {
    this.socket = socket;
  }

  close() {
  }

}

module.exports = {WebSocketVitrineApp}
