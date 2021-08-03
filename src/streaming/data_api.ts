import { Router, Request, Response, NextFunction } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'

const route = Router()

route.get('/api/:key', function (req: Request, res: Response, next: NextFunction) {

  const key = req.params.key;
  res.json({ key: key });

})

route.get('/random', function (req: Request, res: Response, next: NextFunction) {

  const random = Math.random().toString()
  res.json({random});

})


export default route
