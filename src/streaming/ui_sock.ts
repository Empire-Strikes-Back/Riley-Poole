
export interface SockOptions {

  /* default: false **/
  isReconnecting: boolean
  /* default: 1000 **/
  reconnectInterval: number
  /* default: '' **/
  url: string
  /* default: [] **/
  protocols?: string[]
  /* default: Infinity **/
  reconnectMaxAttemps?: number
}

export var socket: WebSocket

export class Sock {

  socket: WebSocket
  timeoutIdReconnect: number
  reconnectAttemps: number

  options: SockOptions = {
    isReconnecting: false,
    reconnectInterval: 1000,
    reconnectMaxAttemps: Infinity,
    url: '',
    protocols: []
  }

  constructor(options: SockOptions) {
    Object.assign(this.options, options)
    this.reconnectAttemps = this.options.reconnectMaxAttemps
    return this
  }

  connect() {
    this.disconnect()
    const { url, protocols, reconnectInterval } = this.options
    this.socket = new WebSocket(url, protocols)
    this.socket.addEventListener('close', (evt) => {
      clearTimeout(this.timeoutIdReconnect)
      if (this.reconnectAttemps > 0) {
        this.reconnectAttemps--
        console.warn(`will reconnect in ${reconnectInterval}, ${this.reconnectAttemps} left`)
        setTimeout(() => {
          this.connect()
        }, reconnectInterval)
      }
    })
    this.socket.addEventListener('open', () => {
      console.info(`weboscket connect to ${this.options.url}`)
      clearInterval(this.timeoutIdReconnect)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
    }
  }

}
