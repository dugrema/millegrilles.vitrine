import {expose as comlinkExpose} from 'comlink'
import {
  chargerMappingSite, appliquerSiteConfiguration, chargerSiteConfiguration,
  rechargerConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
  verifierSignature,
} from '../containers/resolverRessources'

comlinkExpose({
  chargerMappingSite, appliquerSiteConfiguration, chargerSiteConfiguration,
  rechargerConfiguration,
  getUrl, getSection,
  resolveUrlFuuid,
  verifierSignature,
})
