import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import * as path from 'path'
import * as cors from 'cors'
import * as morgan from 'morgan'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import * as serveIndex from 'serve-index'
import { CAMERAS } from './state'
import { logger } from './logger';
import { PORT } from './config';


const NODE_ENV = process.env.NODE_ENV;

export const app = express();


app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message, encoding) => {
      logger.info(message);
    }
  }
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('data/public', { index: false, extensions: ['html'] }))
app.use(express.static('dist/client', { extensions: ['html'] }))
app.use(express.static('dist/scripts'))
app.use('/logs', serveIndex('logs', { icons: true }))
app.use('/logs', express.static('logs'))


app.get('/', (req: express.Request, res: express.Response, next: Function) => {
  res.send('OK')
})

// catch 404 and forward to error handler
// app.use((req: express.Request, res: express.Response, next: Function) => {

//   // let err = new Error('Not Found');
//   // res.status(404);
//   // logger.debug('catching 404 error');
//   // return next(err);

//   // let err = new Error('Not Found');
//   // res.status(404);
//   logger.debug('catching 404 error');
//   res.send("404 :( ")
// });


app.listen(PORT, () => {
  logger.info('Express server listening on port ' + PORT);
}).on('error', err => {
  logger.error('Cannot start server, port most likely in use', err);
});


