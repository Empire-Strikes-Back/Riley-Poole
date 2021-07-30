
import { Cams } from '@streaming/types'
import * as config from './config'

export const FETCH_PARAMS = {
  mode: 'cors' // ?
}

export async function fetchJson<R = any>(url: string, query: string = '', partialInit?: RequestInit): Promise<R> {
  const data = await fetch(`${url}?${query}`, Object.assign({}, FETCH_PARAMS, partialInit))
  const json = await data.json()
  return json
}

export const fetchDatasetsInfo = () => fetchJson<Cams.DatasetInfo[]>(`${config.DATA_HOST}/datasets.json`)

export const fetchDataset = (name: string) => fetchJson<Cams.Dataset>(`${config.DATA_HOST}/dataset-2/${name}`)
export const terminateAllStreams = () => fetchJson<any[]>(`${config.SPAWN_FFMPEG_HOST}/stop-all`)

