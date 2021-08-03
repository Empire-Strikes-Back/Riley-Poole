import { logger } from './logger'
import { PORT } from './config'

Object.assign(process.env, {
  NODE_ENV: process.argv['includes']('--release') ? 'production' : 'development',
})


import app from './app';

Promise.resolve()
  .then(() => {
    return new Promise((R, J) => {
      R();
    })
  })
  .then(() => {

    // shut all stream down evey day
    // setInterval(() => {

    //   state.streamsFluentMjpeg.forEach((stream) => {

    //     try {

    //       stream.stop(new Error('dayily manual shutdown'))

    //     } catch (e) {
    //       logger.error(e.stack)
    //     }

    //   })

    // }, 86400000)

    app.listen(PORT, () => {
      logger.info('Express server listening on port ' + PORT);
    }).on('error', err => {
      logger.error('Cannot start server, port most likely in use', err);
    });
  })
  .catch(err => {
    console.log(err.stack)
    logger.error(err);
  })
