import {wrap as comlinkWrap, releaseProxy} from 'comlink'

var _resourceResolverInstance,
    _resourceResolverWorker

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

export function cleanupWorkers() {
  /* Fonction pour componentWillUnmount : cleanupWorkers(this) */
  try {
    if(_resourceResolverWorker) _resourceResolverWorker[releaseProxy]()
    if(_resourceResolverInstance) _resourceResolverInstance.terminate()
  }
  catch(err) {console.error("Erreur fermeture worker resolver %O", err)}
  finally {
    _resourceResolverInstance = null
    _resourceResolverWorker = null
  }
}
