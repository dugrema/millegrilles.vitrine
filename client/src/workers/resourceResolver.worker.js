import {expose as comlinkExpose} from 'comlink'
import {
  setSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
} from '../containers/resolverRessources'

comlinkExpose({
  setSiteConfiguration, chargerSiteConfiguration,
  getUrl, getSection,
})
