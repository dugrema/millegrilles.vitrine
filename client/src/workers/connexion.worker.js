import {expose as comlinkExpose} from 'comlink'
import { io } from 'socket.io-client'
import { getRandomValues } from '@dugrema/millegrilles.common/lib/chiffrage'
import multibase from 'multibase'

var _socket,
    _callbackSiteMaj,
    _callbackSectionMaj,
    _callbackSetEtatConnexion,
    _resolverWorker,
    _verifierSignature   // web worker resolver (utilise pour valider signature messages)

function connecter(url) {

  const urlInfo = new URL(url)
  const hostname = 'https://' + urlInfo.host
  const pathSocketio = urlInfo.pathname

  console.debug("Connecter socket.io a url host: %s, path: %s", hostname, pathSocketio)
  _socket = io(hostname, {
    path: pathSocketio,  // '/vitrine/socket.io',
    transport: [
      // 'polling',
      'websocket'
    ],
  })

  _socket.on('connect', _=>{
    console.debug("Connecte")
    onConnect()
  })
  _socket.on('reconnect', _=>{
    console.debug("Reconnecte")
    onConnect()
  })
  _socket.on('disconnect', _=>{
    console.debug("Disconnect socket.io")
  })
  _socket.on('connect_error', err=>{
    console.debug("Erreur socket.io : %O", err)
  })

}

async function onConnect() {

  // S'assurer que la connexion est faite avec le bon site
  const randomBytes = new Uint8Array(64);
  await getRandomValues(randomBytes)
  const challenge = String.fromCharCode.apply(null, multibase.encode('base64', randomBytes))
  const reponse = await new Promise((resolve, reject)=>{
    console.debug("Emission challenge connexion Socket.io : %O", challenge)
    const timeout = setTimeout(_=>{
      reject('Timeout')
    }, 15000)
    _socket.emit('challenge', {challenge}, reponse=>{
      console.debug("Reponse challenge connexion Socket.io : %O", reponse)
      clearTimeout(timeout)

      if(reponse.reponse === challenge) {
        resolve(reponse)
      } else{
        reject('Challenge mismatch')
      }
    })
  })

  // Valider la reponse signee
  // const signatureValide = await _verifierSignature(reponse)
  const signatureValide = await _resolverWorker.verifierSignature(reponse)
  if(!signatureValide) {
    throw new Error("Signature de la reponse invalide, serveur non fiable")
  }

  // On vient de confirmer que le serveur a un certificat valide qui correspond
  // a la MilleGrille.

  // Emettre l'evenement qui va faire enregistrer les evenements de mise a jour
  // pour le mapping, siteconfig et sections
  _socket.emit('ecouterMaj')

  // _socket.join('site')
  // _socket.join('section')
  _socket.on('majSiteconfig', message=>{
    if(_callbackSiteMaj) _callbackSiteMaj(message)
  })
  _socket.on('majSection', message=>{
    if(_callbackSectionMaj) _callbackSectionMaj(message)
  })
}

function setResolverWorker(resolverWorker) {
  _resolverWorker = resolverWorker
}

function setCallbacks(siteMaj, sectionMaj, setEtatConnexion) {
  _callbackSiteMaj = siteMaj
  _callbackSectionMaj = sectionMaj
  _callbackSetEtatConnexion = setEtatConnexion
}

comlinkExpose({
  connecter,
  setResolverWorker, setCallbacks,
})
