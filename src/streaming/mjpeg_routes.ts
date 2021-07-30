import { Router, Request, Response, NextFunction } from 'express'
import * as cp from 'child_process'
import * as path from 'path'
import * as portscanner from 'portscanner'
import * as winston from 'winston'
import 'winston-daily-rotate-file'
import * as fs from 'fs-extra'
import { StreamFluentFFmpeg } from '../modules/stream-fluent-ffmpeg'

import { PORT_MAX, PORT_MIN } from '../config'
import { logger as logger_global } from '../logger'

import { createLogger } from './_logger'


const route = Router()
const STREAMS = new Map<string, StreamFluentFFmpeg>()

route.post('/start', function (req: Request, res: Response, next: NextFunction) {

  portscanner.findAPortNotInUse(PORT_MIN, PORT_MAX, 'localhost')
    .then((port) => {
      logger.debug('FREE PORT ' + port);
      const url: string = req.query.url;//

      if (!url) {
        logger.warn('no url provided');
        res.json({ error: 'no url provided' })
        return;
      }
      const stream = STREAMS.get(url);
      if (stream && !stream.error) {
        console.warn('stream already exists');
        res.json({ port: stream.wss.options.port, error: stream.error || 'undefined' })
        return;
      }

      if (stream && stream.error) {
        console.warn('stream was down, deleting');
        STREAMS.delete(stream.id);
      }

      logger.info(`creating ${url} stream`);

      const inputOptions = url.startsWith('rtsp') ? [
        '-rtsp_transport tcp'
      ] : [];

      //http://blog.superuser.com/2012/02/24/ffmpeg-the-ultimate-video-and-audio-manipulation-tool/
      const newStream = new StreamFluentFFmpeg(
        url, url,
        inputOptions, [
          // '-vcodec mjpeg',
          // '-r 24',
          // '-r 8',
          '-b:v', '2500k',
          // '-crf', '0',
          // '-acodec','none',
          // '-bufsize 24k',
          // '-s 640x480',
          // '-fs','10485760',
          // '-use_wallclock_as_timestamps 1',
          '-f mjpeg',
        ],
        createStreamLogger(url),
        10000
      )
        .on('error', (err, streamId) => {
          // logger.error('stream: onerror');
          // logger.error(streamId, err);
          if (!res.finished) {
            res.json({ error: err })
          }

          return true;
        })
        .on('rip', (err, streamId) => {
          // logger.error('stream: onrip');
          // logger.error(streamId, err);
          STREAMS.delete(newStream.id);
          if (!res.finished) {
            res.json({ error: err })
          }
          return true;
        })

      STREAMS.set(url, newStream);

      newStream.start({
        port: port
      }, (options) => {
        res.json({ port: options.port })
        logger.info(`stream ${url} created successfully`);
      })

    })
    .catch((err: Error) => {
      console.log(err.message)
      console.log(err.stack)
      res.json({ error: err.message })
    })
  // res.sendFile(path.join(__dirname, '../../', 'data/public', 'nori.html'));
})

route.post('/stop', function (req: Request, res: Response, next: NextFunction) {
  const id = req.query.url;
  try {
    const stream = STREAMS.get(id);
    stream.stop(new Error('stop request'))
    STREAMS.delete(stream.id);
    res.json({ message: 'stream terminated' });
  } catch (err) {
    res.json({ err: err.message });
  }
})

route.post('/stopAll', function (req: Request, res: Response, next: NextFunction) {
  try {
    STREAMS.forEach((stream) => {
      stream.stop(new Error('stop request all'))
      STREAMS.delete(stream.id);
    })
  } catch (err) {
    res.json({ err: err.message });
  }

  res.json({ message: 'terminated all streams' });
})

route.get('/status', function (req: Request, res: Response, next: NextFunction) {

  const json: any = {
    streams: {}
  };

  STREAMS.forEach((stream) => {

    json.streams[stream.id] = {
      id: stream.id,
      status: !!stream.error
    }
  })

  json.count_streams = STREAMS.size;
  res.json(json);
})



const logger = createLogger({
  dirname: 'logs/server/routes/mjpeg',
  filename: 'route.mjpeg.log'
})



function createStreamLogger(filename: string) {

  filename = filename.replace(/(\/|\\|:)/g, '')
  const DIRNAME = `logs/server/stream/id/${filename}`
  const FILENAME = `${filename}.log`
  fs.ensureDirSync(DIRNAME);

  return createLogger({
    dirname: DIRNAME,
    filename: FILENAME
  })


}



export default route
