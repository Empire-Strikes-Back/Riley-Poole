import { observable, action, reaction, IReactionDisposer, computed, autorun, IObservableValue, IObservable, ObservableMap, IMapChange, extendObservable } from 'mobx';
import { History, Location } from 'history'
import { history } from 'src/history'

import { Evt, Cams, Stream, ReadyState, Pkg, FFmpeg, Nginx } from '@streaming/types'

import * as api from 'src/api'
import * as config from 'src/config'

import { Store } from './'
import { HlsStreamState, PlayerState } from 'src/types'
import { Sock } from 'src/modules/sock'

enum LocalStorage {
  STREAMS_SELECTED = 'STREAMS_SELECTED'
}

export class HlsStore {

  store: Store
  sock: Sock

  @observable streams = new Map<string, HlsStreamState>()
  streamsSelected: ObservableMap<number>


  constructor(store: Store) {
    this.store = store

    const streamsSelected = JSON.parse(localStorage.getItem(LocalStorage.STREAMS_SELECTED)) || []
    // console.log(streamsSelected)
    this.streamsSelected = observable.shallowMap(streamsSelected)

    this.streamsSelected.observe((changes) => {
      localStorage.setItem(LocalStorage.STREAMS_SELECTED, JSON.stringify(Array.from(changes.object as any)))
    })

    this.sock = new Sock({
      url: `ws://${config.HUB_HOSTNAME}:${config.HUB_PORT_WSS}`,
      reconnectInterval: 1000,
      isReconnecting: true,
      // reconnectMaxAttemps: 3
    })
    this.sock.connect()
    this.sock.socket.addEventListener('message', (evt: MessageEvent) => {
      const pkg: Pkg = JSON.parse(evt.data)
      if (pkg.type == Pkg.Type.ECHO &&
        pkg.dataType == Pkg.DataType.STREAM
      ) {
        this.processStreamEvent(pkg)
      }
    })
  }


  @action
  updateStream(ps: Partial<HlsStreamState>) {
    const stream = this.streams.get(ps.id)
    Object.assign(stream, ps)
  }

  @action
  updateStreamState(state: Partial<Stream.State>) {
    const stream = this.streams.get(state.id)
    if (!stream) {
      console.warn('cold not update stream', state)
      return
    }
    Object.assign(stream.state, state)
  }

  @action
  updateStreamPlayer(player: Partial<PlayerState>) {
    const stream = this.streams.get(player.id)
    Object.assign(stream.player, player)
  }

  @action
  addToBoard = (id: string) => {
    const stream = this.streams.get(id)
    // Object.assign(stream,{
    //   wallCount: ++stream.wallCount
    // })
    const count = ++stream.wallCount
    this.updateStream({
      id: id,
      wallCount: count
    })
    this.streamsSelected.set(id, count)
  }

  @action
  subtractFromBoard = (id: string) => {
    const stream = this.streams.get(id)
    if (stream.wallCount == 0) {
      return
    }
    const count = --stream.wallCount
    this.updateStream({
      id: id,
      wallCount: count
    })
    this.streamsSelected.set(id, count)
  }

  @action
  processStreamEvent = (pkg: Pkg<Pkg.Stream>) => {

    const app = this.store
    console.warn('PKG STREAM', pkg)

    this.updateStreamState(pkg.data.state)

  }


  onStartStream = (id: string) => {
    this.sendPkgStream(id, Stream.Type.START)
  }

  onTerminateStream = (id: string) => {
    this.sendPkgStream(id, Stream.Type.STOP)
  }

  sendPkgStream(url: string, type?: Stream.Type) {

    const pkg: Pkg<Pkg.Stream> = {
      timestamp: Date.now(),
      topic: Pkg.Topic.STREAMING,
      channel: 'web',
      type: Pkg.Type.CMD,
      dataType: Pkg.DataType.STREAM,
      data: {
        type: type,
        state: {
          id: url,
          ffmpeg: {
            id: url,
            url_src: url,
            url_mpd: undefined,
            url_hls: undefined,
            msg: undefined,
            error: undefined,
            readyState: ReadyState.UNSET,
            cmdLine: undefined,
            codecData: undefined
          },
          nginx: {
            id: url,
            url_src: url,
            url_hls: undefined,
            url_mpd: undefined,
            readyState: ReadyState.UNSET,
            last_healthcheck: undefined,
            last_healthcheck_str: undefined,
            last_status: undefined,
            msg: undefined,
            error: undefined,
          }
        }
      }
    }

    this.send(pkg)
  }


  send(data: Pkg) {
    console.warn('sending', data)
    this.sock.socket.send(JSON.stringify(data))
  }

}
