import { Router, Request, Response, NextFunction } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import * as data from '../data'


const route = Router()

route.get('*', function (req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'max-age=60')
  next()
})


route.get('/', function (req: Request, res: Response, next: NextFunction) {
  res.json({});
})

route.get('/dataset/:name', function (req: Request, res: Response, next: NextFunction) {
  const name = req.params.name;
  const dataset = data.files.dataset(name)
  res.json(dataset);
})

route.get('/datasets', function (req: Request, res: Response, next: NextFunction) {
  const name = req.params.name;
  const datasets = data.files.datasets()
  res.json(datasets);
})


export default route
