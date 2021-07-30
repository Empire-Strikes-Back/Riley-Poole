// import { Router, Request, Response, NextFunction } from 'express'
// import * as cp from 'child_process'
// import * as path from 'path'
// import * as portscanner from 'portscanner'
// import * as winston from 'winston'
// import 'winston-daily-rotate-file'
// import * as fs from 'fs-extra'
// import * as os from 'os'

// import { StreamFFmpegNode } from '../modules/stream-ffmpeg-node'
// import { state } from '../state'
// import { logger as logger_global } from '../logger'
// import { createLogger } from './_logger'

// const MIN_PORT = state.MIN_PORT
// const MAX_PORT = state.MAX_PORT

// const STREAMS = state.STREAMS_HLS
// const PORT_TS = state.PORT_TS
// const HOST_TS = os.hostname()


// const route = Router()

// route.get('/start', function (req: Request, res: Response, next: NextFunction) {
//   let url: string
//   let port: number
//   let stream: StreamFFmpegNode
//   let urlOutput: string
//   Promise.resolve()
//     .then(() => getUrl(req)).then(u => url = u)
//     .then(() => streamExists(url))
//     .then(() => findPort()).then(p => port = p)
//     .then(() => mountStream(url, port)).then(res => {
//       stream = res.stream
//       urlOutput = res.url
//     })
//     .then(() => {
//       stream.on('rip', () => {
//         STREAMS.delete(stream.id)
//       })
//       STREAMS.set(stream.id, stream)
//     })
//     .then(() => {
//       res.json({
//         port,
//         url: urlOutput
//       })
//     })
//     .catch((out: IOut) => {
//       // logger_global.error('stream: onerror');
//       // logger_global.error(streamId, err);
//       // console.log(out)
//       // logger_global.warn(JSON.stringify(out))
//       console.warn(out)
//       res.json(out)
//     })

// })


// route.post('/stop', function (req: Request, res: Response, next: NextFunction) {
//   const id = req.query.url;
//   try {
//     const stream = STREAMS.get(id);
//     stream.stop(new Error('stop request'))
//     STREAMS.delete(stream.id);
//     res.json({ message: 'stream terminated' });
//   } catch (err) {
//     res.json({ err: err.message });
//   }
// })

// route.post('/stop-all', function (req: Request, res: Response, next: NextFunction) {
//   try {
//     STREAMS.forEach((stream) => {
//       stream.stop(new Error('stop request all'))
//       STREAMS.delete(stream.id);
//     })
//   } catch (err) {
//     res.json({ err: err.message });
//   }

//   res.json({ message: 'terminated all streams' });
// })

// route.get('/status', function (req: Request, res: Response, next: NextFunction) {

//   const json: any = {
//     streams: {}
//   };

//   STREAMS.forEach((stream) => {

//     json.streams[stream.id] = {
//       id: stream.id,
//       status: !!stream.error
//     }
//   })

//   json.count_streams = STREAMS.size;
//   res.json(json);
// })


// interface IOut {
//   error?: any
//   port?: number
//   msg?: any
// }

// function findPort() {
//   return (portscanner.findAPortNotInUse(MIN_PORT, MAX_PORT, 'localhost') as Promise<number>)
//     .then((port: number) => {
//       if (!port) {
//         throw new Error(`no available ports found in range ${MIN_PORT} ${MAX_PORT}`)
//       }
//       logger_global.debug('FREE PORT ' + port);
//       logger.debug('FREE PORT ' + port);
//       return port
//     })
// }

// function urlPublishTs(url: string) {
//   return `http://${HOST_TS}:${PORT_TS}/publish/${urlToIdString(url)}`
// }

// function urlWatchTs(url: string) {
//   return `http://${HOST_TS}:${PORT_TS}/play/hls/${urlToIdString(url)}/index.m3u8`
// }


// function getUrl(req: Request) {
//   const url: string = req.query.url;
//   if (!url) {
//     throw new Error('no url provided in request')
//   }
//   return url
// }

// function streamExists(url: string) {
//   const stream = STREAMS.get(url)
//   if (stream && !stream.error) {
//     logger_global.debug(`stream ${url} already exists`);
//     logger.info(`stream ${url} already exists`);
//     throw { port: stream.wss.options.port, msg: 'already exists', url: urlWatchTs(url) }
//   }
// }
// //ffmpeg -re -y -use_wallclock_as_timestamps 1 -i http://host:6400 -c libx264 -f mpegts http://127.0.0.1:3040/publish/http
// // ffmpeg -re -y -use_wallclock_as_timestamps 1 -i http://host:6400 -c libx264 -f mpegts http://127.0.0.1:3040/publish/http___host_6400
// function mountStream(url: string, port: number) {

//   return new Promise<{ port: number, url: string, stream: StreamFFmpegNode }>((RES, REJ) => {
//     const inputOptions = [
//       '-re',
//       '-y',
//       '-use_wallclock_as_timestamps 1'
//     ]
//     if (url.startsWith('rtsp')) {
//       inputOptions.unshift('-rtsp_transport tcp')
//     }
//     const output = urlPublishTs(url)

//     const urlStream = urlWatchTs(url)

//     const stream = new StreamFFmpegNode(
//       {
//         id: url,
//         input: url,
//         output: output,
//         inputOptions,
//         outputOptions: [
//           '-c libx264',
//           '-f mpegts',
//         ],
//         logger: createStreamLogger(url),
//         timeoutSelfDestruct: 10000
//       }
//     )

//     stream.start({
//       port: port
//     }, (options) => {
//       logger.info(`stream ${stream.id} created successfully, port: ${port}`);
//       RES({ port: options.port, url: urlStream, stream })
//     })

//   })


// }


// const logger = createLogger({
//   dirname: 'logs/server/routes/hls',
//   filename: 'route.hls.log'
// })


// function urlToIdString(url: string) {
//   return url.replace(/(\/|\\|:|\.)/g, '_')
// }

// function createStreamLogger(filename: string) {

//   filename = urlToIdString(filename)
//   const DIRNAME = `logs/server/stream/id/${filename}`
//   const FILENAME = `${filename}.log`
//   fs.ensureDirSync(DIRNAME);

//   return createLogger({
//     dirname: DIRNAME,
//     filename: FILENAME
//   })


// }



// export default route
