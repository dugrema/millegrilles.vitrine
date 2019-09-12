// Vitrine web socket handler vers l'api de Vitrine (Express WSS)
import openSocket from 'socket.io-client';

export class VitrineWebSocketHandler {
  constructor() {
    this.socket = null;
    this.routingKeyCallbacks = {};
  }

  connecter() {
    let socket = openSocket('/vitrinewss', {reconnection: false});
    this.socket = socket;

    socket.on('mq_message', enveloppe=>{
      let {routingKey, message} = enveloppe;
      console.log("MQ Message recu: " + routingKey);
      console.log(message);
      // this.traiterMessageMq(routingKey, message);
    });
  }
}
