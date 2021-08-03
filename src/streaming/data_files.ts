import { Router, Request, Response, NextFunction } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import { logger } from './logger'

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
  const dataset = files.dataset(name)
  res.json(dataset);
})

route.get('/datasets', function (req: Request, res: Response, next: NextFunction) {
  const name = req.params.name;
  const datasets = files.datasets()
  res.json(datasets);
})

const DATA_URL = path.join(__dirname)

export namespace files {

  export function dataset<T = any>(fileName: string): T {
    return readJson(path.join(DATA_URL, 'db', 'dataset', fileName))
  }

  export function datasets<T = any>(): T {
    return readJson(path.join(DATA_URL, 'public', 'datasets.json'))
  }

  export function readJson(filepath: string) {
    try {
      const file = fs.readFileSync(filepath).toString()
      const json = JSON.parse(file)
      return json
    } catch (err) {
      logger.error(err)
      return undefined
    }
  }
}



export default route
