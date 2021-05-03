import {expose as comlinkExpose} from 'comlink'
import {
  setSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
} from '../containers/resolverRessources'

comlinkExpose({
  setSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
})
