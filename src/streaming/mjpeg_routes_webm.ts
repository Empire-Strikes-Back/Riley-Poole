// import { Router, Request, Response, NextFunction } from 'express'
// import * as cp from 'child_process'
// import * as path from 'path'
// import { state } from '../state'
// import * as WebSocket from 'ws'

// const URL_TEST = {
//   protocol: 'http',
//   port: '1234',
//   hostname: 'localhost'
// }
// const PORT = 3888;

// const wss = new WebSocket.Server({
//   port: PORT
// })

// let childProcess: cp.ChildProcess;

// wss.on('connection', (socket) => {
//   console.log('connected');
// })

// wss['broadcast'] = function broadcast(data) {
//   wss.clients.forEach(function each(client) {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(data);
//     }
//   });
// };


// const route = Router()

// //const options = ["-i", '', '-movflags', 'frag_keyframe+empty_moov', '-f', 'webm', '-'];
// // const options = ["-rtsp_transport", "tcp", "-i", this.url, '-f', 'mpeg1video', '-b:v', '800k', '-r', '30', '-'];
// //const options = ["-i", '', '-vcodec', 'vp8', '-f', 'webm', '-'];
// const options = [
//   // '-r', '8',
//   "-i", `${URL_TEST.protocol}://${URL_TEST.hostname}:${URL_TEST.port}`,
//   '-vcodec', 'vp8',
//   // '-r', '8',
//   // '-b:v','800k',
//   // '-acodec','none',
//   // '-bufsize', '24k',
//   // '-s', '640x480',
//   // '-fs','10485760',
//   '-f', 'webm',

//   '-use_wallclock_as_timestamps', '1',
//   '-'];


// route.get('/start', function (req: Request, res: Response, next: NextFunction) {

//   childProcess = cp.spawn("ffmpeg", options, {
//     detached: false
//   });

//   childProcess.stdout.on('data', function (data) {
//     console.log(process.memoryUsage().rss / 1000000);
//     wss['broadcast'](data);
//   })

//   childProcess.stderr.on('data', function (data) {
//     // console.log('error');

//     console.log('data',data.toString());
//   });

//   childProcess.on('close', (code, signal) => {
//     console.log(`child process ${options[1]} terminated due to receipt of signal ${signal}`);
//   })

//   res.sendFile(path.join(__dirname, '../../../', 'data', 'public', 'webm.html'));
// })
// route.get('/stop', function (req: Request, res: Response, next: NextFunction) {

//   childProcess.kill('SIGINT');
//   res.json({ closed: 'socket' });
// })



// route.post('/', function (req: Request, res: Response, next: NextFunction) {
//   res.json({ value: Math.random(), query: req.query, body: req.body });
// })


// export default route
