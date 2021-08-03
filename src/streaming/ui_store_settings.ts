import { observable, action, reaction, IReactionDisposer, computed, autorun, IObservableValue, IObservable, ObservableMap, IMapChange, extendObservable } from 'mobx';
import { History, Location } from 'history'
import { history } from 'src/history'

import { Evt, Cams, Stream, ReadyState, Pkg, FFmpeg, Nginx } from '@streaming/types'

import { Store } from './'
import * as config from 'src/config'

export const DEAFULT_SETTINGS = config

export class Settings {

  store: Store

  @observable config = Object.assign({}, DEAFULT_SETTINGS)

  constructor(store: Store) {
    this.store = store
  }

  @action
  update(pConfig: Partial<typeof config>) {
    Object.assign(this.config, pConfig)
  }

  @action
  default() {
    this.config = Object.assign({}, DEAFULT_SETTINGS)
  }


}
