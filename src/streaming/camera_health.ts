import { logger } from './logger'
import * as request from 'request'
import { Cams, FFmpeg, Pkg, ReadyState, Stream } from '@streaming/types'
import fetch from 'node-fetch'
import { publishFFmpeg, publishStream } from './writer'
import { reader } from './reader'
import { Camera } from './camera'
import { HOSTNAME, NGINX_TS_HOSTNAME, NGINX_TS_PORT, DATA_HOSTNAME, DATA_PORT } from './config'

import { Evt, FFmpeg, Cams, Stream, Pkg, ReadyState, Nginx } from '@streaming/types'

interface Env {
  NSQLOOKUPD_HOSTNAME: string
  NSQD_HOSTNAME: string
  NSQADMIN_HOSTNAME: string
  NSQLOOKUPD_PORT: number
  NSQD_PORT: number
  NGINX_TS_HOSTNAME: string
  NGINX_TS_PORT: number
  DATA_HOSTNAME: string
  DATA_PORT: number
  PORT: number
  HOSTNAME:string
}

const env: Env & NodeJS.ProcessEnv = process.env as any

export const CHANNEL = 'cam-health'
export const HOSTNAME = env.HOSTNAME || 'localhost'
export const DATA_HOSTNAME = env.DATA_HOSTNAME || 'localhost'
export const DATA_PORT = env.DATA_PORT || 'localhost'


export const NSQLOOKUPD_HOSTNAME = env.NSQLOOKUPD_HOSTNAME || HOSTNAME
export const NSQD_HOSTNAME = env.NSQD_HOSTNAME || HOSTNAME
export const NGINX_TS_HOSTNAME = env.NGINX_TS_HOSTNAME || HOSTNAME
export const NGINX_TS_PORT = env.NGINX_TS_PORT || 1840

export const NSQLOOKUPD_PORT = env.NSQLOOKUPD_PORT || 4161
export const NSQD_PORT = env.NSQD_PORT || 4150
export const NSQLOOKUPD_HOST = `${NSQLOOKUPD_HOSTNAME}:${NSQLOOKUPD_PORT}`
export const PORT = env.PORT || 1808

interface CameraOptions {
  selfDestruct: (cam: Camera) => any

}

export class Camera extends events.EventEmitter {

  static STATE_CHANGED = 'STATE_CHANGED'

  selfDestructTimeout: number = 10000
  timeoutID: any

  options: CameraOptions = {
    selfDestruct: undefined
  }

  state: Stream.State = {
    id: undefined,
    readyState: ReadyState.UNSET,
    ffmpeg: {
      id: undefined,
      url_src: undefined,
      url_hls: undefined,
      url_mpd: undefined,
      readyState: ReadyState.UNSET,
      msg: undefined,
      error: undefined,
      cmdLine: undefined,
      codecData: undefined
    },
    nginx: {
      id: undefined,
      url_src: undefined,
      url_mpd: undefined,
      url_hls: undefined,
      readyState: ReadyState.UNSET,
      last_status: undefined,
      last_healthcheck: undefined,
      last_healthcheck_str: undefined,
      msg: undefined,
      error: undefined
    }
  }

  constructor(options: CameraOptions) {
    super()
    this.options = options
  }

  touch() {
    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.options.selfDestruct(this)
    }, this.selfDestructTimeout)
  }

  setState(ps: Partial<Stream.State>) {
    Object.assign(this.state, ps)
    this.computeReadyState()
    this.emit(Camera.STATE_CHANGED, this.state)
  }

  setStateQuiet(ps: Partial<Stream.State>){
    Object.assign(this.state, ps)
    this.computeReadyState()
  }

  computeReadyState(){
    if (this.state.ffmpeg.readyState == ReadyState.OPEN && this.state.nginx.readyState == ReadyState.OPEN) {
      this.state.readyState = ReadyState.OPEN
    } else if (this.state.ffmpeg.readyState == ReadyState.OPEN || this.state.ffmpeg.readyState == ReadyState.CONNECTING) {
      this.state.readyState = ReadyState.CONNECTING
    } else if (this.state.ffmpeg.readyState == ReadyState.CLOSED && this.state.nginx.readyState == ReadyState.OPEN) {
      this.state.readyState = ReadyState.CLOSING
    } else if (this.state.ffmpeg.readyState == ReadyState.CLOSING || this.state.nginx.readyState == ReadyState.CLOSING) {
      this.state.readyState = ReadyState.CLOSING
    }
    else {
      this.state.readyState = ReadyState.CLOSED
    }
  }





}


export const CAMERAS = new Map<string, Camera>()


export const writer = new Writer(NSQD_HOSTNAME, NSQD_PORT, {})

const NODE_ENV = process.env.NODE_ENV;


writer
  .on(Writer.READY as 'ready', () => {
    logger.info(`writer ${CHANNEL} connected ${NSQD_PORT}`)
  })
  .on(Writer.ERROR as 'error', (err) => {
    logger.error(`writer ${CHANNEL} error: ${err.message}`)
  })
  .on(Writer.CLOSED as 'closed', () => {
    logger.warn('Writer closed')
    logger.info('Writer will reconnect...')
    writer.connect()
  })

writer.connect()



export const reader = new Reader(Pkg.Topic.STREAMING, CHANNEL, {
  lookupdHTTPAddresses: NSQLOOKUPD_HOST,
  maxInFlight: 1000,
  // maxAttempts:1,
  lookupdPollInterval: 10,
})

reader
  .on(Reader.NSQD_CONNECTED as 'nsqd_connected', () => {
    logger.info(`reader ${CHANNEL} connected  ${NSQLOOKUPD_HOST}`)
  })
  .on(Reader.ERROR as 'error', (err) => {
    logger.error(`reader ${CHANNEL} error:   ${err.message}`)
  })
  .on(Reader.NSQD_CLOSED as 'nsqd_closed', (err) => {
    logger.warn(`reader ${CHANNEL} closed:   ${err}`)
    logger.info(`reader ${CHANNEL} will reconnect...`)
    reader.connect()
  })

reader.connect()


// setInterval(() => {

//   publish<Evt.FFmpeg.Type.I.ERROR>({
//     data: {
//       type: Evt.FFmpeg.Type.E.ERROR,
//       err: 'manual'
//     },
//     timestamp: Date.now(),
//     topic: 'streaming',
//     channel: 'ffmpeg'
//   })

// }, 5000)


export function publishStream(data: Pkg.Stream, type: Pkg.Type = Pkg.Type.ECHO) {
  const pkg: Pkg<Pkg.Stream> = {
    topic: Pkg.Topic.STREAMING,
    channel: CHANNEL,
    timestamp: Date.now(),
    type: type,
    dataType: Pkg.DataType.STREAM,
    data: data
  }
  writer.publish(pkg.topic, JSON.stringify(pkg))
}

export function publishFFmpeg(data: Pkg.FFmpeg, type: Pkg.Type = Pkg.Type.CMD) {
  const pkg: Pkg<Pkg.FFmpeg> = {
    topic: Pkg.Topic.STREAMING,
    channel: CHANNEL,
    timestamp: Date.now(),
    type: type,
    dataType: Pkg.DataType.FFMPEG,
    data: data
  }

  writer.publish(pkg.topic, JSON.stringify(pkg))
}

const INTERVAL = 2000

setInterval(() => {
  CAMERAS.forEach((c) => {
    const cam = c
    if (cam.state.ffmpeg.readyState != ReadyState.OPEN) {
      return
    }
    // if(cam.state.nginx.readyState == ReadyState.OPEN && cam.state.ffmpeg.readyState == ReadyState.OPEN){
    //   return
    // }
    fetch(urlWatchTsInnnerNetwork(cam.state.ffmpeg.url_src)).then(r => {
      // logger.info(r.status.toString()) // 200, 400
      // logger.info(r.statusText) // OK  Not Found
      r.text().then((i3u8) => {
        const date = new Date()
        const isClosing = i3u8.includes('EXT-X-ENDLIST')
        const readyState = r.status != 200 ? ReadyState.CLOSED : (isClosing ? ReadyState.CLOSING : ReadyState.OPEN)
        const ps: Partial<Stream.State> = {
          nginx: {
            ...cam.state.nginx,
            readyState: readyState,
            last_healthcheck: date.getTime(),
            last_healthcheck_str: date.toString(),
            last_status: r.status,
            msg: 'readyState set by cam-health helthcheck routine'
          }
        }
        cam.setState(ps)
      })

    })
  })
}, INTERVAL)


reader
  .on('message', msg => {
    const pkg: Pkg = JSON.parse(msg.body.toString())
    console.log(`pkg: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)

    if (
      pkg.dataType == Pkg.DataType.STREAM &&
      pkg.type != Pkg.Type.ECHO
    ) {
      onPkgStream(pkg)
    }

    if (pkg.dataType == Pkg.DataType.FFMPEG) {
      onPkgFFmpeg(pkg)
    }

    msg.finish()

  })


function onPkgStream(pkg: Pkg<Pkg.Stream>) {

  if(!pkg.data.state.id || ! pkg.data.state.ffmpeg.url_src){
    logger.warn(`STREAM START: no cam_url`)
    return
  }

  const cam = getCamera(pkg.data.state.id, pkg.data.state.ffmpeg.url_src)

  // cam.touch()

  if (pkg.data.type == Stream.Type.START) {
    publishFFmpeg({
      type: FFmpeg.Type.START,
      state: cam.state.ffmpeg,
    }, Pkg.Type.CMD)
    //
  }

  if (pkg.data.type == Stream.Type.STOP) {
    // cam.setState({
    //   nginx: {
    //     ...cam.state.nginx,
    //     readyState: ReadyState.CLOSING
    //   }
    // })
    publishFFmpeg({
      type: FFmpeg.Type.STOP,
      state: cam.state.ffmpeg,
    }, Pkg.Type.CMD)

    //
  }

  if (pkg.data.type == Stream.Type.STATUS) {
    publishStream({
      type: Stream.Type.STATUS,
      state: cam.state,
    }, Pkg.Type.ECHO)
  }

}

function onPkgFFmpeg(pkg: Pkg<Pkg.FFmpeg>) {

  if (pkg.type != Pkg.Type.ECHO) {
    return
  }

  if (pkg.data.type == FFmpeg.Type.STATUS) {
    const ffmpegState = pkg.data.state
    const cam = CAMERAS.get(ffmpegState.id)
    if (!cam) {
      logger.info(`camera not exists, ffmpeg does : ${ffmpegState.id}`)
      return
    }
    cam.setState({
      ffmpeg: {
        ...cam.state.ffmpeg,
        ...ffmpegState
      }
    })
  }


}

function createCamera(url: string) {
  // console.warn('create camera ' + url)
  const cam = new Camera({
    selfDestruct: (cam) => {
      publishFFmpeg({
        type: FFmpeg.Type.STOP,
        state: cam.state.ffmpeg
      }, Pkg.Type.CMD)
    }
  })

  cam.setState({
    id: url,
    readyState: ReadyState.CLOSED,
    ffmpeg: {
      ...cam.state.ffmpeg,
      id: url,
      readyState: ReadyState.UNSET,
      url_src: url,
      url_hls: urlWatchTs(url)
    },
    nginx: {
      ...cam.state.nginx,
      id: url,
      url_src: url,
      readyState: ReadyState.CLOSED,
      url_hls: urlWatchTs(url)
    }
  })
  cam.on(Camera.STATE_CHANGED, (state: Stream.State) => {
    // console.warn('amera.STATE_CHANGE',state)
    publishStream({
      type: Stream.Type.STATUS,
      state: state
    })
  })

  // cam.touch()

  return cam

}
function getCamera(id: string, url: string) {
  let cam = CAMERAS.get(id)
  console.warn(id)
  if (!cam) {
    cam = createCamera(url)
    CAMERAS.set(cam.state.id, cam)
  }
  return cam
}

function urlPublishTs(url: string) {
  return `http://${NGINX_TS_HOSTNAME}:${NGINX_TS_PORT}/publish/${urlToIdString(url)}`
}

function urlWatchTs(url: string) {
  return `http://${HOSTNAME}:${NGINX_TS_PORT}/play/hls/${urlToIdString(url)}/index.m3u8`
}
function urlWatchTsInnnerNetwork(url: string) {
  return `http://${NGINX_TS_HOSTNAME}:${NGINX_TS_PORT}/play/hls/${urlToIdString(url)}/index.m3u8`
}
export function urlToIdString(url: string) {
  return url.replace(/(\/|\\|:|\.)/g, '_')
}

// request
//   .get('http://host:1825/dataset/httpcameras.json', {
//   }, (err, res, body) => {
//     cams = JSON.parse(body).items
//   })
//   .on('error', (err) => {
//     console.log(err.message)
//   })
// function getCams() {

//     return Promise.all<Cams.Dataset, Cams.Dataset>([
//       fetch(`http://${DATA_HOSTNAME}:${DATA_PORT}/dataset-2/httpcameras.json`).then(r => r.json()),
//       fetch(`http://${DATA_HOSTNAME}:${DATA_PORT}/dataset-2/rtspcameras.json`).then(r => r.json())
//     ])
//       .then(([kre, int]) => {
//         cams = kre.items.concat(int.items)
//           .filter(c => c.version.object.cam_url)
//         return cams
//       })
//   }



Object.assign(process.env, {
  NODE_ENV: process.argv['includes']('--release') ? 'production' : 'development',
})
