import {expose as comlinkExpose} from 'comlink'
import {init, resolveUrl} from '../containers/resolverRessources'

comlinkExpose({
  init, resolveUrl
})
