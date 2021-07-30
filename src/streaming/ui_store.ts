import { observable, action, reaction, runInAction, IReactionDisposer, computed, autorun, IObservableValue, IObservable, ObservableMap, IMapChange, extendObservable } from 'mobx'
import { History, Location } from 'history'
import { history } from 'src/history'
import { Evt, Cams, Stream, ReadyState, Pkg, FFmpeg, Nginx } from '@streaming/types'
import * as api from 'src/api'
import { HlsStreamState } from 'src/types'
import { HlsStore } from './hls'
import { Settings } from './settings'


export interface Stores {
  store: Store
}


export class Store {

  hls: HlsStore
  settings: Settings


  @observable.ref datasets: Cams.Dataset[] = []
  @observable.ref datasetsInfo: Cams.DatasetInfo[] = []
  @observable.ref cams: Cams.CameraInfo[] = []

  @observable siderbarCollapsed: boolean = true


  constructor() {
    this.hls = new HlsStore(this)
    this.settings = new Settings(this)

  }

  @action
  sidebarToggle(collapsed?: boolean) {
    this.siderbarCollapsed = typeof collapsed != 'undefined' ? collapsed : !this.siderbarCollapsed
  }

  @action
  fetchDatasets() {
    api.fetchDatasetsInfo().then((dInfo) => {
      return Promise.all(
        dInfo.map(di => api.fetchDataset(di.fileName))
      )
        .then((sets) => {
          runInAction(() => {
            this.datasets = sets
            this.datasetsInfo = dInfo
            const cams = sets.reduce<Cams.CameraInfo[]>((p, c) => {
              p = p.concat(c.items)
              return p
            }, [])
            this.cams = cams
            cams.forEach((cam) => {
              const stream = defaultStreamState(cam)
              const id = stream.id || String(stream.cam.id)
              this.hls.streams.set(id, stream)
              const streamO = this.hls.streams.get(id)
              const wallCount = this.hls.streamsSelected.get(streamO.id)
              if (wallCount) {
                streamO.wallCount = wallCount
              }

            })
          })
        })
    })
  }


}

function defaultStreamState(cam: Cams.CameraInfo): HlsStreamState {
  const cam_url = cam.version.object.cam_url
  return {
    id: cam_url,
    cam: cam,
    wallCount: 0,
    player: {
      id: cam_url,
      isMoveControlsVisible: false,
      wasMoveControlRequestSuccessful: false,
      isRecording: false,
      timeRecordingStarted: 0,
      timeRecordingCurrent: 0,
      timeRecordingDuration: 0,
      timeRecordingDurationString: '00:00:00'
    },
    state: {
      id: cam_url,
      readyState: ReadyState.UNSET,
      ffmpeg: {
        id: cam_url,
        url_src: cam_url,
        url_mpd: undefined,
        url_hls: undefined,
        msg: undefined,
        error: undefined,
        readyState: ReadyState.UNSET,
        cmdLine: undefined,
        codecData: undefined
      },
      nginx: {
        id: cam_url,
        url_src: cam_url,
        url_hls: undefined,
        url_mpd: undefined,
        readyState: ReadyState.UNSET,
        last_healthcheck: undefined,
        last_healthcheck_str: undefined,
        last_status: undefined,
        msg: undefined,
        error: undefined,
      }
    },

  }

}


export const store = new Store()
window['store'] = store

store.fetchDatasets()
