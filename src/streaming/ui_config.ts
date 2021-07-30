export const HUB_PORT = 1805
export const HUB_PORT_WSS = 1100
// export const SERVICE_HOSTNAME = 'host'
export const SERVICE_HOSTNAME = location.hostname

export const DATA_PORT = 1825
export const SPAWN_FFMPEG_HOST = `http://${SERVICE_HOSTNAME}:${1806}`
// export const HUB_HOSTNAME = NODE_ENV == 'production' ? 'host' : '127.0.0.1'

export const HUB_HOSTNAME = location.hostname
// export const HUB_HOSTNAME = 'host'
export const HUB_HOST_WS = `ws://${HUB_HOSTNAME}:${HUB_PORT_WSS}`

export const DATA_HOST = `http://${SERVICE_HOSTNAME}:${DATA_PORT}`


