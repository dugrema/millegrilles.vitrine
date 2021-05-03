import {expose as comlinkExpose} from 'comlink'
import {setSiteConfiguration, chargerSiteConfiguration, resolveUrl} from '../containers/resolverRessources'

comlinkExpose({
  setSiteConfiguration, chargerSiteConfiguration, resolveUrl
})
