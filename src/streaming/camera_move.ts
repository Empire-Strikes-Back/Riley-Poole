import { logger } from './logger'
import * as request from 'request'
import { Cams, FFmpeg, Pkg, ReadyState, Stream } from '@streaming/types'
import { reader } from './reader'
import { CAMERAS } from './state'
import './express-app'
import { Reader } from 'nsqjs';

import './writer'
const INTERVAL = 2000

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

export const CHANNEL = 'cam-move'
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


export const CAMERAS = new Map<string, any>()


reader
  .on('message', msg => {
    const pkg: Pkg = JSON.parse(msg.body.toString())
    console.log(`pkg: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)

    msg.finish()

  })


reader.connect()


export const reader = new nsq.Reader(Pkg.Topic.STREAMING, CHANNEL, {
  lookupdHTTPAddresses: NSQLOOKUPD_HOST,
  maxInFlight: 1000,
  // maxAttempts:1,
  lookupdPollInterval: 10,
})

reader.on(Reader.NSQD_CONNECTED as any, () => {
  logger.info(`reader ${CHANNEL} connected  ${NSQLOOKUPD_HOST}`)
})

reader.on(Reader.NSQD_CLOSED as any, () => {
  logger.info(`reader ${CHANNEL} closed  ${NSQLOOKUPD_HOST}`)
})

reader.on(Reader.ERROR as any, (err) => {
  logger.error(`nsqd reader error ${CHANNEL}, ${NSQLOOKUPD_HOST}`)
  logger.error(err.message)

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



export const writer = new Writer(NSQD_HOSTNAME, NSQD_PORT)
.on(Writer.READY as any, () => {
  logger.info(`writer ${CHANNEL} ready  ${NSQD_PORT}`)
  // w.publish('sample_topic', 'it really tied the room together')
  // w.publish('sample_topic', 'This message gonna arrive 1 sec later.', 1000 as any)
  // w.publish('sample_topic', [
  //   'Uh, excuse me. Mark it zero. Next frame.',
  //   'Smokey, this is not \'Nam. This is bowling. There are rules.'
  // ])
  // w.publish('sample_topic', 'Wu?', err => {
  //   if (err) { return console.error(err.message) }
  //   console.log('Message sent successfully')
  //   w.close()
  // })
})
.on(Writer.CLOSED as any, () => {
  logger.info(`writer ${CHANNEL} closed ${NSQD_PORT}`)
})

writer.connect()

// export function publishEvent<T>(evt: Evt<T>) {
//   writer.publish(evt.topic, JSON.stringify(evt))
// }

