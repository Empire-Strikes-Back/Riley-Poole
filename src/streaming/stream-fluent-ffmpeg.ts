import * as cp from 'child_process'
import * as path from 'path'
import * as WebSocket from 'ws'
import * as stream from 'stream'
import * as events from "events";

import * as ffmpeg from 'fluent-ffmpeg';

import * as winston from 'winston'


export type tEventType = 'ffmpegError' | 'ffmpegData' | 'rip'

/**
* creates a 'ws' websocket server, uses 'fluetn-ffmpeg'
* to output stream data to every connected client websocket
*
*/
export class StreamFluentFFmpeg extends events.EventEmitter {

    id: string
    error: Error
    stream: stream.Writable
    command: ffmpeg.FfmpegCommand
    wss: WebSocket.Server
    ffmpegStarted: boolean = false
    logger: winston.LoggerInstance
    timeoutID: any
    timeoutSelfDestruct: number

    /**
    * inputOptions/outputOptions is for ffmpeg (uses 'fluetn-ffmpeg')
    *
    */
    constructor(id: string, input: string, inputOptions: string[], outputOptions: string[], logger: winston.LoggerInstance, timeoutSelfDestruct: number = 7000) {
        super();
        this.id = id;
        this.logger = logger;
        this.timeoutSelfDestruct = timeoutSelfDestruct
        this.command = ffmpeg()
            .on('error', this.onFFmpegError.bind(this))
            .on('start', this.onFFmpegStart.bind(this))
            .on('codecData', this.onFFmpegCodecData.bind(this))
            .on('progress', this.onFFmpegProgress.bind(this))
            .on('stderr', this.onFFmpegStdErr.bind(this))
            .on('end', this.onFFmpegEnd.bind(this))
            .input(input)
            .inputOption(inputOptions)
            .outputOptions(outputOptions)
        return this;
    }

    selfDestruct = () => {
        const errMsg = `stream ${this.id}: no data received for ${this.timeoutSelfDestruct}`
        this.logger.warn(errMsg)
        this.stop(new Error(errMsg))
    }

    /**
      * create fluent-ffmepg stream, listen to 'data' output, create wss server,
      * every connected client will get data
      */
    start(options: WebSocket.ServerOptions, callback?: Function) {
        this.stream = this.command.pipe(this.stream)
        this.stream.on('data', this.onStreamData.bind(this))
        this.wss = new WebSocket.Server(options, () => {
            this.logger.info(`stream ${this.id}: wss started, port ${this.wss.options.port}`)
            callback(options);
        });
        // this.wss.on('headers', this.onWSSHeaders.bind(this));
        this.wss.on('connection', this.onWSSConnection.bind(this));
        this.wss.on('error', this.onWSSError.bind(this));

        // this.logger.info(`stream ${this.id}: wss started, port ${this.wss.options.port}`)

        clearTimeout(this.timeoutID)
        this.timeoutID = setTimeout(this.selfDestruct, this.timeoutSelfDestruct)

        return this;
    }

    stop(err: Error) {
        this.logger.warn(`stream ${this.id}: will stop`);
        this.error = new Error(err.message);
        try {
            // this.logger.error('', err)
            // if (this.ffmpegStarted) {
            this.command.kill('SIGKILL');
            // }
            // this.command.removeAllListeners();
            // this.stream.removeAllListeners();
            this.wss.close();
            this.logger.info(`stream ${this.id}: wss closed, port ${this.wss.options.port}`)
            this.wss.removeAllListeners();
            this.wss.clients.forEach((client) => {
                client.removeAllListeners();
            })
            clearTimeout(this.timeoutID)
            this.logger.close()
        } catch (err) {
            this.logger.error(`stream ${this.id}: error while stopping - ${err.message}`)
        }
        return this;
    }


    wssBroadCast(data) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        })
    }

    onWSSConnection(client: WebSocket) {
        this.logger.info(`stream ${this.id}: wss-client connected, total count: ${this.wss.clients.size}`);
        client.on('error', this.onWSSClientError.bind(this));
    }
    onWSSClientError(err: Error) {
        this.logger.error(`stream ${this.id}: wss-client error - ${err.message}`);
    }
    onWSSHeaders(headers: string[]) {
        /* */
    }
    onWSSError(err: Error) {
        this.logger.error(`stream ${this.id}: wss error - ${err.message}`);
        let type: tEventType = 'rip'
        this.emit(type, err, this.id);
        this.stop(err);
    }

    onFFmpegStdErr(stderrLine) {
        this.logger.debug(`stream ${this.id}: ffmpeg stderr.ouput - ${stderrLine}`);
        let type: tEventType = 'ffmpegError'
        this.emit(type, stderrLine);
    }

    onFFmpegError(err: Error, stdout, stderr) {
        this.logger.error(`stream ${this.id}: ffmpeg error - ${err.message}`);
        let type: tEventType = 'rip'
        this.emit(type, err, this.id);
        this.stop(err)
    }
    onFFmpegEnd(stdout, stderr) {
        const errMsg = `stream ${this.id}: ffmpeg transcoding succeeded, shutting stream down`
        this.logger.warn(errMsg);
        let type: tEventType = 'rip'
        const err = new Error(errMsg)
        this.emit(type, err, this.id);
        this.stop(err)
    }

    onFFmpegProgress(progressIfno) {
        this.logger.debug(`stream ${this.id}: ${progressIfno}`);
    }

    onFFmpegStart(commandLine) {
        this.ffmpegStarted = true;
        this.logger.info(`stream ${this.id}: ffmpeg spawned ffmpeg w/ commandline '${commandLine}' `);
    }

    onFFmpegCodecData(data) {
        this.logger.info(`stream ${this.id}: ffmpeg input is '${data.audio}' audio w/ '${data.video}' video`);
    }

    onStreamData(data) {
        // this.logger.info('data')
        clearTimeout(this.timeoutID)
        this.timeoutID = setTimeout(this.selfDestruct, this.timeoutSelfDestruct)
        this.wssBroadCast(data);
        const type: tEventType = 'ffmpegData'
        this.emit(type, data);
    }

}


