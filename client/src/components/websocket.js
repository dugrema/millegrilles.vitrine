// Vitrine web socket handler vers l'api de Vitrine (Express WSS)
import { WebSocketManager } from 'millegrilles.common/lib/webSocketManager'

const PATH_SOCKETIO = '/vitrine/socket-io'

export class VitrineWebSocketHandler {
  constructor(domaine) {
    this.domaine = domaine;

    this.socket = null;

    // Bind methodes avec this
    this.connecter = this.connecter.bind(this);
    this.reconnecter = this.reconnecter.bind(this);
    this.deconnexion = this.deconnexion.bind(this);
    this.deconnecter = this.deconnecter.bind(this);
  }

  async connecter() {
    // let urlConnexion = '/' + this.domaine;
    // // console.debug("Ouverture WSS vers " + urlConnexion);
    // this.socket = openSocket(urlConnexion, {path: PATH_SOCKETIO});
    // this._enregistrerEvenements();

    const config = {
      path: PATH_SOCKETIO,
      reconnection: true,
    }
    const websocketConnexion = new WebSocketManager(config)
    // websocketConnexion.disconnectHandler = this.props.desactiverProtege

    await websocketConnexion.connecter()
    console.debug("Authentification completee")
    return websocketConnexion
  }

  reconnecter() {
  }

  deconnecter() {
    this.socket.disconnect()
    this.socket = null;
  }

  deconnexion() {
    // console.error("WSS Vitrine Deconnecte");
  }

  _enregistrerEvenements() {
    // Enregistre les evenements sur le socket
    this.socket.on('disconnect', this.deconnexion);
    this.socket.on('reconnect', this.reconnecter);
  }

  enregistrerCallback(key, callback) {
    this.socket.on(key, callback);
  }

}
