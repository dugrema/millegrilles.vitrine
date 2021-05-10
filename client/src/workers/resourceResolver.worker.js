import {expose as comlinkExpose} from 'comlink'
import {
  chargerMappingSite, appliquerSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
} from '../containers/resolverRessources'

comlinkExpose({
  chargerMappingSite, appliquerSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
})
