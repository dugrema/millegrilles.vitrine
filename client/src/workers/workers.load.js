import {wrap as comlinkWrap, releaseProxy} from 'comlink'

var _resourceResolverInstance,
    _resourceResolverWorker,
    _connexionInstance,
    _connexionWorker

export async function getResolver() {

  if(!_resourceResolverWorker) {
    const ResourceResolver = (await import('./resourceResolver.worker')).default
    _resourceResolverInstance = new ResourceResolver()
    _resourceResolverWorker = await comlinkWrap(_resourceResolverInstance)
  }

  return {
    workerInstance: _resourceResolverInstance,
    webWorker: _resourceResolverWorker,
  }
}

export async function getConnexion() {
  if(!_connexionWorker) {
    const Connexion = (await import('./connexion.worker')).default
    _connexionInstance = new Connexion()
    _connexionWorker = await comlinkWrap(_connexionInstance)
  }

  return {
    workerInstance: _connexionInstance,
    webWorker: _connexionWorker,
  }
}

export function cleanupWorkers() {
  try {
    if(_resourceResolverWorker) _resourceResolverWorker[releaseProxy]()
    if(_resourceResolverInstance) _resourceResolverInstance.terminate()
  }
  catch(err) {console.error("Erreur fermeture worker resolver %O", err)}
  finally {
    _resourceResolverInstance = null
    _resourceResolverWorker = null
  }

  try {
    if(_connexionWorker) _connexionWorker[releaseProxy]()
    if(_connexionInstance) _connexionInstance.terminate()
  }
  catch(err) {console.error("Erreur fermeture worker connexion %O", err)}
  finally {
    _connexionInstance = null
    _connexionWorker = null
  }
}
