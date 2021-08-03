import * as cp from 'child_process'
import * as path from 'path'
import * as WebSocket from 'ws'
import * as stream from 'stream'
import * as events from "events";

import * as ffmpeg from 'fluent-ffmpeg';

import * as winston from 'winston'


export type EventType = 'ffmpegError' | 'ffmpegData' | 'rip'

export interface IStreamFFmpegOptions {
    id: string
    input: string
    output?: string
    inputOptions: string[]
    outputOptions: string[]
    logger: winston.LoggerInstance
    timeoutSelfDestruct?: number
    withData?: boolean
}

/**
* creates a 'ws' websocket server, uses 'fluetn-ffmpeg'
* to output stream data to every connected client websocket
*
*/
export class StreamFFmpegNode extends events.EventEmitter {

    id: string
    error: Error
    props: IStreamFFmpegOptions
    stream: stream.Writable
    command: ffmpeg.FfmpegCommand
    wss: WebSocket.Server
    ffmpegStarted: boolean = false
    logger: winston.LoggerInstance
    timeoutID: any
    timeoutSelfDestruct: number
    withData: boolean

    /**
    * inputOptions/outputOptions is for ffmpeg (uses 'fluetn-ffmpeg')
    *
    */
    constructor(options: IStreamFFmpegOptions) {
        super();
        const  { id, input, inputOptions, outputOptions,output, logger, timeoutSelfDestruct = 7000, withData = false }= options
        this.props = options
        this.id = id;
        this.logger = logger;
        this.withData = withData
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
        if(output){
            this.command.output(output)
        }
        return this;
    }

    selfDestruct = () => {
        const errMsg = `stream ${this.id}: no data received for ${this.timeoutSelfDestruct}`
        this.logger.warn(errMsg)
        this.stop(new Error(errMsg))
    }

    /**
      * Create fluent-ffmepg stream, listen to 'data' output, create wss server,
      * every connected client will get data
      */
    start(options: WebSocket.ServerOptions, callback?: (options: WebSocket.ServerOptions) => any) {
        if (this.withData) {
            this.stream = this.command.pipe(this.stream)
        } else {
            this.command.run()

        }
        // this.stream.on('data', this.onStreamData.bind(this))
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
        let type: EventType = 'rip'
        this.emit(type, err, this.id);
        this.stop(err);
    }

    onFFmpegStdErr(stderrLine: string) {
        if(stderrLine.includes('frame=')){
            clearTimeout(this.timeoutID)
        }
        this.logger.debug(`stream ${this.id}: ffmpeg stderr.ouput - ${stderrLine}`);
        let type: EventType = 'ffmpegError'
        this.emit(type, stderrLine);
    }

    onFFmpegError(err: Error, stdout, stderr) {
        this.logger.error(`stream ${this.id}: ffmpeg error - ${err.message}`);
        let type: EventType = 'rip'
        this.emit(type, err, this.id);
        this.stop(err)
    }
    onFFmpegEnd(stdout, stderr) {
        const errMsg = `stream ${this.id}: ffmpeg transcoding succeeded, shutting stream down`
        this.logger.warn(errMsg);
        let type: EventType = 'rip'
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

    // onStreamData(data) {
    //     // this.logger.info('data')
    //     clearTimeout(this.timeoutID)
    //     this.timeoutID = setTimeout(this.selfDestruct, this.timeoutSelfDestruct)
    //     this.wssBroadCast(data);
    //     const type: EventType = 'ffmpegData'
    //     this.emit(type, data);
    // }

}


