import { logger } from './logger'

import './express-app';

Object.assign(process.env, {
  NODE_ENV: process.argv['includes']('--release') ? 'production' : 'development',
})


process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', '\n', err.stack)
})


// import './kafka'
// import './kafka-no'
// import './node-rdkafka'

