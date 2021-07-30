
export enum ReadyState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CLOSING = 'CLOSING',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
  UNSET = 'UNSET'

}


export interface Pkg<D = any> {
  timestamp: number
  channel: string
  type: Pkg.Type
  topic: Pkg.Topic
  data: D
}

export namespace Pkg {

  export enum Topic {
    STREAMING = 'STREAMING'
  }

  export enum Type {
    CMD = 'CMD',
    QRY = 'QRY',
    ECHO = 'ECHO'
  }
}


export interface Pkg<D = any> {
  timestamp: number;
  channel: string;
  type: Pkg.Type;
  dataType: Pkg.DataType
  topic: Pkg.Topic;
  data: D;
}
export namespace Pkg {
  export enum Topic {
    STREAMING = "STREAMING",
  }
  export enum DataType {
    STREAM = 'STREAM',
    FFMPEG = 'FFMPEG',
    NGINX = 'NGINX'
  }
  export enum Type {
    CMD = "CMD",
    QRY = "QRY",
    ECHO = "ECHO",
  }

  export interface Stream {
    type: Stream.Type
    state: Stream.State
  }
  export interface Nginx {
    type: Nginx.Type
    state: Nginx.State
  }
  export interface FFmpeg {
    type: FFmpeg.Type
    state: FFmpeg.State
  }
}
export namespace Stream {
  export enum Type {
    STATUS = "STATUS",
    START = "START",
    STOP = "STOP",
  }
  export interface State {
    id: string;
    readyState?: ReadyState;
    nginx?: Nginx.State;
    ffmpeg?: FFmpeg.State;
  }
}
export namespace Nginx {
  export enum Type {
    STATUS = "STATUS"
  }
  export interface State {
    id: string;
    readyState: ReadyState;
    url_src: string;
    last_healthcheck: number
    last_healthcheck_str: string
    last_status: number
    url_hls: string;
    url_mpd: string;
    msg: string;
    error: string;
  }
}
export namespace FFmpeg {
  export enum Type {
    STATUS = "STATUS",
    START = "START",
    STOP = "STOP",
  }
  export interface State {
    id: string;
    readyState: ReadyState;
    url_src: string;
    url_hls: string;
    url_mpd: string;
    msg: string;
    error: string;
    cmdLine: string;
    codecData: string
  }
}






// export enum ReadyState {
//   CHILL,
//   ERROR,
//   OPEN,
//   LOADING,
//   RECORDING
// }


// export enum Status {
//   OPEN = 'OPEN',
//   CLOSED = 'CLOSED',
//   CLOSING = 'CLOSING',
//   CONNECTING = 'CONNECTING',
//   ERROR = 'ERROR',
//   UNSET = 'UNSET'

// }


// type ttt = EventDataFFmpeg[EventDataTypeFFmpeg.ERROR]
  // type t = Pick<EventDataFFmpeg, 'ERROR'>
  // type tt = Record<'ERROR', EventDataFFmpeg>


export namespace Cams {

    export interface DatasetInfo {
      title: string
      fileName: string,
      type: CamType
    }

    export interface Dataset {
      type: CamType
      items: CameraInfo[]
    }

    export enum CamType {
      httpcameras = 3,
      rtspcameras = 2
    }

    export interface CameraInfo {
      "id": number;
      "title": string;
      "fullTitle": string;
      "version": {
        "id": number;
        "dateStart": string;
        "object": {
          "type": CamType;
          "title": string;
          "address": string;
          "cam_url": string;
          "control_url": string;
          "geocoordinates": {
            "type": string;
            "features": {
              "type": string;
              "geometry": {
                "type": string;
                "coordinates": string[];
              };
              "properties": {};
            }[];
          };
          "_type": {
            "id": number;
            "versionId": number;
            "title": string;
            "absolutPath": string;
            "available": boolean;
            "reason": string;
            "rfc": boolean;
            "version": {
              "icon": {
                "mime": string;
                "name": string;
                "size": number;
                "uuid": string;
              };
              "proto": string;
              "title": string;
              "visibility_radius": number;
            };
          };
        };
      };
      "isAvailable": boolean;
      "versionId": number;
      "absolutPath": string;
      "lastChange": string;
    }
  }



export namespace FFmpeg {

  export enum Cmd {
    START = 'START',
    STARTED = 'STARTED',
    TERMINATE = 'TERMINATE',
    TERMINATED = 'TERMINATED',
    ERROR = 'ERROR',
    EXISTS = 'EXISTS'
  }

  export interface Data {
    id: string
    cmd: Cmd
    url: string
    url_hls?: string
    url_mpd?: string
    cmdLine?: string
    msg?: string
  }
}



export interface Evt<T = any> {
  timestamp: number
  from?: string
  topic: 'streaming'
  data: T
}

export enum EvtType {
  CMD = 'CMD',
  QRY = 'QRY',
  ECHO = 'ECHO'
}
