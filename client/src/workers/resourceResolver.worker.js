import {expose as comlinkExpose} from 'comlink'
import {
  appliquerSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
} from '../containers/resolverRessources'

comlinkExpose({
  appliquerSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
})
