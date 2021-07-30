// import { Router, Request, Response, NextFunction } from 'express'
// import * as cp from 'child_process'
// import * as path from 'path'
// import * as portscanner from 'portscanner'
// import * as winston from 'winston'
// import 'winston-daily-rotate-file'
// import * as fs from 'fs-extra'

// import { StreamFFmpegNode } from '../modules/stream-ffmpeg-node'

// import { state } from '../state'
// import { logger as logger_global } from '../logger'
// import { createLogger } from './_logger'

// const MIN_PORT = state.MIN_PORT
// const MAX_PORT = state.MAX_PORT
// const STREAMS = state.STREAMS_MJPEG_NEW

// const route = Router()

// route.post('/start', function (req: Request, res: Response, next: NextFunction) {
//   let url: string
//   let port: number
//   let stream: StreamFFmpegNode
//   Promise.resolve()
//     .then(() => getUrl(req)).then(u => url = u)
//     .then(() => streamExists(url))
//     .then(() => findPort()).then(p => port = p)
//     .then(() => mountStream(url,port)).then(s => stream = s)
//     .then(() => {
//       stream.on('rip', () => {
//         STREAMS.delete(stream.id)
//       })
//       STREAMS.set(stream.id, stream)
//     })
//     .then(() => {
//       res.json({
//         port
//       })
//     })
//     .catch((out: IOut) => {
//       // logger_global.error('stream: onerror');
//       // logger_global.error(streamId, err);
//       // console.log(out)
//       // logger_global.warn(JSON.stringify(out))
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
//     throw { port: stream.wss.options.port, msg: 'already exists' }
//   }
// }

// function mountStream(url: string, port: number) {

//   const stream = new StreamFFmpegNode(
//     {
//       id: url,
//       input: url,
//       withData: true,
//       inputOptions: url.startsWith('rtsp') ? ['-rtsp_transport tcp'] : [],
//       outputOptions: [
//         // '-vcodec mjpeg',
//         // '-r 24',
//         // '-r 8',
//         '-b:v', '2500k',
//         // '-crf', '0',
//         // '-acodec','none',
//         // '-bufsize 24k',
//         // '-s 640x480',
//         // '-fs','10485760',
//         // '-use_wallclock_as_timestamps 1',
//         '-f mjpeg',
//       ],
//       logger: createStreamLogger(url),
//       timeoutSelfDestruct: 10000
//     }
//   )



//   stream.start({
//     port: port
//   }, (options) => {
//     logger.info(`stream ${stream.id} created successfully, port: ${port}`);
//     throw { port: options.port }
//   })

//   stream.stream.on('data', (data) => {
//     // this.logger.info('data')
//     clearTimeout(stream.timeoutID)
//     stream.timeoutID = setTimeout(stream.selfDestruct, stream.timeoutSelfDestruct)
//     stream.wssBroadCast(data);
//     stream.emit('ffmpegData', data);
//   })

// // .on('error', (err, streamId) => {
// //   logger_global.error('stream: onerror');
// //   // logger_global.error(streamId, err);
// //   if (!res.finished) {
// //     res.json({ error: err })
// //   }
// //   return true;
// // })
// // .on('rip', (err, streamId) => {
// //       // logger.error('stream: onrip');
// //       // logger.error(streamId, err);
// //       state.STREAMS.delete(newStream.id);
// //       if (!res.finished) {
// //         res.json({ error: err })
// //       }
// //       return true;
// //     })

//   return stream
// }

// function startStream(stream: StreamFFmpegNode, port: number) {
//   stream.start({
//     port: port
//   }, (options) => {
//     logger.info(`stream ${stream.id} created successfully, port: ${port}`);
//     throw { port: options.port }
//   })
//   stream.stream.on('data', (data) => {
//     // this.logger.info('data')
//     clearTimeout(stream.timeoutID)
//     stream.timeoutID = setTimeout(stream.selfDestruct, stream.timeoutSelfDestruct)
//     stream.wssBroadCast(data);
//     stream.emit('ffmpegData', data);
//   })
// }


// const logger = createLogger({
//   dirname: 'logs/server/routes/mjpeg',
//   filename: 'route.mjpeg.log'
// })

// function createStreamLogger(filename: string) {

//   filename = filename.replace(/(\/|\\|:)/g, '')
//   const DIRNAME = `logs/server/stream/id/${filename}`
//   const FILENAME = `${filename}.log`
//   fs.ensureDirSync(DIRNAME);

//   return createLogger({
//     dirname: DIRNAME,
//     filename: FILENAME
//   })


// }



// export default route
