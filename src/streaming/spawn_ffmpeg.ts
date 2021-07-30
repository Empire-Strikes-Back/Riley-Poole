import * as cp from 'child_process'
import * as path from 'path'
import * as WebSocket from 'ws'
import * as stream from 'stream'
import * as events from "events";
import * as os from 'os'
import * as ffmpeg from 'fluent-ffmpeg';
import * as winston from 'winston'
import * as R from 'ramda'
import { Router, Request, Response, NextFunction } from 'express'
import { Evt, FFmpeg, Cams, Pkg, Stream, ReadyState } from '@streaming/types'

import { NGINX_TS_HOSTNAME, NGINX_TS_PORT, HOSTNAME } from './config'
import { reader } from './reader'
import { publishStatus } from './writer'

import { app } from './express-app'
import { STREAMS, startStream, stopStream } from './state'


const MAX_STREAM_COUNT = 3

interface Env {
  NSQLOOKUPD_HOSTNAME: string
  NSQD_HOSTNAME: string
  NSQADMIN_HOSTNAME: string
  NSQLOOKUPD_PORT: number
  NSQD_PORT: number
  NGINX_TS_HOSTNAME: string
  NGINX_TS_PORT: number
  PORT: number
  HOSTNAME:string
}

const env: Env & NodeJS.ProcessEnv = process.env as any

export const CHANNEL = 'spawn-ffmpeg'
export const HOSTNAME = env.HOSTNAME || 'localhost'

export const NSQLOOKUPD_HOSTNAME = env.NSQLOOKUPD_HOSTNAME || HOSTNAME
export const NSQD_HOSTNAME = env.NSQD_HOSTNAME || HOSTNAME
export const NGINX_TS_HOSTNAME = env.NGINX_TS_HOSTNAME || HOSTNAME
export const NGINX_TS_PORT = env.NGINX_TS_PORT || 1840

export const NSQLOOKUPD_PORT = env.NSQLOOKUPD_PORT || 4161
export const NSQD_PORT = env.NSQD_PORT || 4150
export const NSQLOOKUPD_HOST = `${NSQLOOKUPD_HOSTNAME}:${NSQLOOKUPD_PORT}`
export const PORT = env.PORT || 1806


export interface FFMpegStreamOptions {
  id: string
  url_src: string
  timeoutSelfDestruct?: number
  logger: winston.LoggerInstance
  // type: Cams.CamType
  url_play_hls: string
  url_publish_hls: string
  cmdOptions: {
    input: string
    output: string
    inputOptions: string[]
    outputOptions: string[]
  }
}


export class FFMpegStream extends events.EventEmitter {

  static STATE_CHANGED = 'STATE_CHANGED'

  options: FFMpegStreamOptions = {
    id: undefined,
    url_src: undefined,
    url_play_hls: undefined,
    url_publish_hls: undefined,
    logger: undefined,
    timeoutSelfDestruct: 10000,
    cmdOptions: undefined,
    // type: undefined
  }
  state: FFmpeg.State
  timeoutID: any = undefined
  cmd: ffmpeg.FfmpegCommand

  constructor(options: FFMpegStreamOptions) {
    super()
    Object.assign(this.options, options)

    this.state = {
      id: options.id,
      readyState: ReadyState.CLOSED,
      url_src: options.url_src,
      url_hls: options.url_play_hls,
      url_mpd: undefined,
      msg: 'INITIAL',
      error: undefined,
      cmdLine: undefined,
      codecData: undefined
    }

    return this
  }

  setState(ps: Partial<FFmpeg.State>) {
    Object.assign(this.state, ps)
    this.emit(FFMpegStream.STATE_CHANGED, this.state)
  }

  log(msg: string, logger: any) {
    logger(`${this.options.id}: ${msg}`)
  }

  cmdMount() {
    const { cmdOptions } = this.options
    const logger = this.options.logger

    const onceOnFrame = (stderrLine: string) => {
      if (stderrLine.includes('frame=')) {
        clearTimeout(this.timeoutID)
        this.setState({
          readyState: ReadyState.OPEN,
        })
        this.cmd.removeListener('stderr', onceOnFrame)
      }
    }

    this.cmd = ffmpeg()
      // .withOptions(options)
      .input(cmdOptions.input)
      .inputOption(cmdOptions.inputOptions)
      .outputOptions(cmdOptions.outputOptions)
      .output(cmdOptions.output)
      .on('start', (cmdLine) => {
        this.timeoutID = setTimeout(this.selfDestruct, this.options.timeoutSelfDestruct)
        const msg = `spawned ffmpeg w/ commandline: ${cmdLine} `
        this.setState({
          readyState: ReadyState.CONNECTING,
          msg: msg,
          cmdLine: cmdLine,
        })
        this.log(msg, logger.info)
      })
      .on('stderr', onceOnFrame)
      .on('codecData', (data) => {
        const msg = `video: ${data.video} ; audio: ${data.audio}`
        this.setState({
          codecData: msg
        })
        this.log(msg, logger.info)

      })
      .on('error', (err) => {
        clearTimeout(this.timeoutID)
        const msg = `ffmpeg error - ${err.message}`
        this.setState({
          msg: msg,
          error: err.message,
          readyState: ReadyState.CLOSED
        })
        this.log(msg, logger.error)
      })
      .on('end', () => {
        const errMsg = `ffmpeg transcoding succeeded, shutting stream down`
        this.setState({
          readyState: ReadyState.CLOSED,
          error: errMsg,
          msg: errMsg
        })
        this.log(errMsg, logger.error)
      })
    return this
  }

  selfDestruct = () => {
    const { id, timeoutSelfDestruct } = this.options
    const errmsg = `stream ${id}: no data received for ${timeoutSelfDestruct}`
    this.log(errmsg, this.options.logger.info)
    this.cmd.emit('error', new Error(errmsg))
  }

}



export const STREAMS: FFMpegStream[] = []


export function stopStream(id: string) {
  const stream = STREAMS.find(s => s.options.id == id)
  if (stream) {
    stream.cmd.kill('SIGKILL')
    const i = STREAMS.findIndex(s => s.options.id == id)
    STREAMS.splice(i, 1)
  }

}


export function startStream(url: string) {
  const logger = createStreamLogger(url)

  // const optionsHttp = ['-re', '-y', '-use_wallclock_as_timestamps 1', `-i ${url}`, '-c:v libx264', '-f mpegts', `${urlPublishTs(url)}`]
  const optionsHttp = {
    input: url,
    output: urlPublishTs(url),
    inputOptions: ['-re', '-y', '-use_wallclock_as_timestamps 1'],
    outputOptions: ['-c libx264', '-f mpegts',]
  }
  // const optionsRtsp = ['-y', '-rtsp_transport tcp', '-i  rtsp://host:554/57', '-c:v libx264', '-s 1280x720', '-b:v 600k', '-f mpegts', `${urlPublishTs(url)}`]
  const optionsRtsp = {
    input: url,
    output: urlPublishTs(url),
    inputOptions: ['-y', '-rtsp_transport tcp'],
    outputOptions: ["-c:v libx264", "-s 1280x720", "-b:v 2500k", "-f mpegts"]
  }
  const options = url.startsWith('rtsp') ? optionsRtsp : optionsHttp

  const stream = new FFMpegStream({
    id: url,
    url_src: url,
    url_play_hls: urlWatchTs(url),
    url_publish_hls: urlPublishTs(url),
    logger: logger,
    cmdOptions: options
  })
    .cmdMount()
    .on(FFMpegStream.STATE_CHANGED, (state: FFmpeg.State) => {
      publishStatus(state)
    })

  stream
    .cmd
    .on('error', () => {
      stopStream(stream.options.id)
    })
    .on('end', () => {
      stopStream(stream.options.id)
    })

  STREAMS.push(stream)

  stream.cmd.run()

}



function urlPublishTs(url: string) {
  return `http://${NGINX_TS_HOSTNAME}:${NGINX_TS_PORT}/publish/${urlToIdString(url)}`
}

function urlWatchTs(url: string) {
  return `http://${HOSTNAME}:${NGINX_TS_PORT}/play/hls/${urlToIdString(url)}/index.m3u8`
}

export function urlToIdString(url: string) {
  return url.replace(/(\/|\\|:|\.)/g, '_')
}



process.on('exit', () => {
  STREAMS.forEach((stream) => {
    stream.cmd.kill('SIGKILL')
  })
})

app.get('/status', (req, res, next) => {
  res.json(STREAMS.map(s => s.state));
})

app.get('/stop-all', (req, res, next) => {
  STREAMS.forEach((stream) => {
    stopStream(stream.state.id)
  })
  res.json(STREAMS.map(s => s.options.id));
})


export const writer = new Writer(NSQD_HOSTNAME, NSQD_PORT, {})

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

// export function publish<T = any>(data: T) {
//   publishEvent({
//     topic: 'streaming',
//     from: 'spawn-hls',
//     timestamp: Date.now(),
//     data: data
//   })
// }

export function publishStatus(state: FFmpeg.State) {
  const pkg: Pkg<Pkg.FFmpeg> = {
    topic: Pkg.Topic.STREAMING,
    channel: 'spawn-hls',
    type: Pkg.Type.ECHO,
    timestamp: Date.now(),
    dataType: Pkg.DataType.FFMPEG,
    data: {
      type: FFmpeg.Type.STATUS,
      state: state
    }
  }
  writer.publish(pkg.topic, JSON.stringify(pkg))
}

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



reader
  .on('message', msg => {
    const pkg: Pkg<Pkg.FFmpeg> = JSON.parse(msg.body.toString())
    // console.log(`pkg: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)
    if (pkg.dataType != Pkg.DataType.FFMPEG) {
      msg.finish()
      return
    }
    if (![Pkg.Type.CMD, Pkg.Type.QRY].includes(pkg.type)) {
      msg.finish()
      return
    }
    if (pkg.data.type == FFmpeg.Type.STATUS) {
      msg.finish()
      return
    }
    onevent(pkg)
    msg.finish()

  })


export function onevent(pkg: Pkg<Pkg.FFmpeg>) {
  console.log(`pkg: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)
  if (pkg.data.type == FFmpeg.Type.START) {
    const state = pkg.data.state
    const id = state.id
    const stream = STREAMS.find(s => s.options.id == id)
    if (stream) {
      publishStatus(stream.state)
      return
    }
    if(STREAMS.length > MAX_STREAM_COUNT){
      const oldestStream = STREAMS[0]
      stopStream(oldestStream.options.id)
    }
    startStream(pkg.data.state.url_src)
  }
  if (pkg.data.type == FFmpeg.Type.STOP) {
    stopStream(pkg.data.state.url_src)
  }

}




