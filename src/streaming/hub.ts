import { Writer, Reader } from 'nsqjs'
import { logger } from './logger'
import * as WebSocket from 'ws'
import { Cams, FFmpeg, Evt, Pkg } from '@streaming/types'
import { NSQD_PORT, NSQD_HOSTNAME, NSQLOOKUPD_HOST, PORT_WSS } from './config'
import { reader } from './reader'
import { writer } from './writer'

interface Env {
  NSQLOOKUPD_HOSTNAME: string
  NSQD_HOSTNAME: string
  NSQADMIN_HOSTNAME: string
  NSQLOOKUPD_PORT: number
  NSQD_PORT: number
  PORT: number
  PORT_WSS: number
  HOSTNAME: string
}

export const CHANNEL = 'hub'
const env: Env & NodeJS.ProcessEnv = process.env as any
export const HOSTNAME = env.HOSTNAME || 'localhost'

export const NSQLOOKUPD_HOSTNAME = env.NSQLOOKUPD_HOSTNAME || HOSTNAME
export const NSQD_HOSTNAME = env.NSQD_HOSTNAME || HOSTNAME
export const NSQADMIN_HOSTNAME = env.NSQADMIN_HOSTNAME || HOSTNAME

export const NSQLOOKUPD_PORT = env.NSQLOOKUPD_PORT || 4161
export const NSQD_PORT = env.NSQD_PORT || 4150
export const NSQLOOKUPD_HOST = `${NSQLOOKUPD_HOSTNAME}:${NSQLOOKUPD_PORT}`
export const PORT = env.PORT || 1805
export const PORT_WSS = env.PORT_WSS || 1100


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


// process.on('uncaughtException', (err) => {
//   logger.error('uncaughtException', '\n', err.stack)
// })

reader.on('message', msg => {
  // logger.warn('before broadcast', JSON.parse(msg.body.toString()))
  // if(msg.hasResponded){
  //   logger.warn('has responded', JSON.parse(msg.body.toString()))
  //   return
  // }
  const pkg: Pkg = JSON.parse(msg.body.toString())
  logger.info(`pkg: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)
  if (pkg.type == Pkg.Type.ECHO) {
    logger.info(`bradcasting: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)
    broadcast(pkg)
  }

  msg.finish()

  // msg.finish()
  // if(!msg.hasResponded){

  // }
  // msg.requeue(0,false)

})



export const wss = new WebSocket.Server({
  port: PORT_WSS
} as WebSocket.ServerOptions, () => {
  logger.info(`wssHub started, port ${wss.options.port}`)
});

wss.on('connection', (client: WebSocket) => {
  logger.info(`client connected`)
  client.on('message', data => {
    const pkgString = data.toString()
    const pkg: Pkg = JSON.parse(pkgString)
    logger.info(`publishing: ${pkg.channel} ${pkg.type} ${pkg.dataType}`)
    writer.publish(pkg.topic, pkgString, (err) => {
      if (err) {
        logger.warn(err.message)
      }
    })
  })
  client.on('close', (arg) => {
    logger.info('client disconnected', arg)
  })
});

wss.on('error', (err) => {
  logger.error(err.message)
})

export function broadcast(pkg: Pkg) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(pkg));
    }
  })
}
