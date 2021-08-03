import { Router, Request, Response, NextFunction } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import * as data from '../data'
import { Cam } from 'onvif'
import { createLogger } from './_logger'

const route = Router()

route.get('*', function (req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'max-age=60')
  next()
})

export interface CameraMoveInfo {
  x: number
  y: number
  hostname: string
  username: string
  password: string
  zoom: number
}

// var data = { foo: "bar" };
// fetch("http://localhost:3004/move", {
//   method: "POST",
//   body: JSON.stringify(data),
//   headers: {
//     "Content-Type": "application/json"
//   }
// }).then(function(response) {
//   // Yay!
// }).catch(function(err) {
//   // Boo!
// });

route.post('/', function (req: Request, res: Response, next: NextFunction) {

  const info: CameraMoveInfo = req.body
  logger.info(info as any)

  if (!info.hostname) {
    res.json({ error: 'no stream url provided in request' });
    return
  }

  // if (!info.username || !info.password) {
  //   return res.json({ error: true, result: 'credentials required' });
  // }
  // return
  // HACK: Cam constructor calls callback twice
  console.log
  let over = false;
  new Cam({
    hostname: info.hostname,
    // username: info.username,
    // password: info.password,
  }, function (err) {
    if (over) {
      return;
    }
    over = true;

    if (err) {
      logger.warn('Onvif connect failed', err);
      return res.status(500).json({ error: true, result: err });
    }
    this.relativeMove({
      x: info.x || 0,
      y: info.y || 0,
      zoom: info.zoom || 0
    }, function (err, res) {
      if (err) {
        logger.warn('Move failed', err);
        return res.status(500).json({ error: true, result: err });
      }
      return res.json({ error: false });
    });
  });
})



const logger = createLogger({
  dirname: 'logs/server/routes/move',
  filename: 'route.move.log'
})


export default route
