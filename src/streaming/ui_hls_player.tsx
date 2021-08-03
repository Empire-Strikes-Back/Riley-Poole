import * as React from 'react'
import * as Hls from 'hls.js'
import { ReadyState, Evt, FFmpeg, Cams, Pkg, Stream } from '@streaming/types'

declare var MediaRecorder

interface IProps {
  className?: string
  streamState: Stream.State
  streamInfo: Cams.CameraInfo
}

interface IState {

  isRecording: boolean
}

export class HlsPlayer extends React.Component<IProps, IState> {

  videoHls: VideoHls
  hls: Hls

  mediaRecorder: any
  recording = []

  state = {
    isRecording: false
  }

  ondataavailable = (evt) => {
    this.recording.push(evt.data)
  }

  onstopmediarecorder = () => {
    this.setState({
      isRecording: false
    })
    const blob = new Blob(this.recording, { type: 'video/webm' })
    saveToDevice(blob, `${(new Date).getTime()}.webm`)
  }

  onerror = () => {
    console.error('mediarecorde error');
  }

  onscreenshot = () => {
    const v = this.videoHls.video
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d');
    const w = canvas.width = v.videoWidth
    const h = canvas.height = v.videoHeight
    context.fillRect(0, 0, w, h);
    context.drawImage(v, 0, 0, w, h);
    const screenshotUrl = canvas.toDataURL('image/png');
    window['fetch'](screenshotUrl).then(f => f.blob()).then((blob) => {
      saveToDevice(blob, `${(new Date).getTime()}.png`)
    })
  }

  startRecording = () => {
    const { isRecording } = this.state
    if (isRecording) {
      this.mediaRecorder.stop()
      return
    }
    const video = this.videoHls.video
    const stream = video['captureStream']()
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const mediaRecorder = this.mediaRecorder
    this.recording.splice(0)
    mediaRecorder.start()
    this.setState({
      isRecording: true
    })
    mediaRecorder.addEventListener('dataavailable', this.ondataavailable);
    mediaRecorder.addEventListener('stop', this.onstopmediarecorder);
    mediaRecorder.addEventListener('error', this.onerror);
    // const video = this.video
    // const stream = video.strea
  }

  stopRecording = () => {
    if (this.mediaRecorder && !(this.mediaRecorder.state == 'inactive')) {
      this.mediaRecorder.stop()
    }
  }

  onStart = () => {
    this.videoHls.hls.startLoad()
  }

  onPause = () => {
    this.videoHls.hls.stopLoad()
  }

  render() {

    const { streamInfo, streamState } = this.props
    const { isRecording } = this.state
    if (!streamInfo) {
      return null
    }
    const { url_hls, url_src } = streamState.ffmpeg

    const buttonStyle: React.CSSProperties = {
      padding: '0 5px 0 5px',
      cursor: 'pointer',
      fontSize: '1.1em'
    }

    return (
      <section style={{ position: 'relative', border: '1px solid black', maxWidth: '240px' }} >
        <main title={`${streamInfo.title}\n${url_src}`}>
          <VideoHls ref={r => this.videoHls = r} url_hls={streamState.ffmpeg.url_hls} readyState={streamState.readyState} />
          <h5 style={{ position: 'absolute', top: '3px', right: '3px', opacity: 0.3 }} >{streamState.readyState}</h5>
        </main>
        <footer style={{
          display: 'flex',
        }}>
          <div title={'start'} style={buttonStyle} onClick={this.onStart}>&#9654;</div>
          <div title={'pasuse'} style={buttonStyle} onClick={this.onPause}>&#10074;&#10074;</div>
          &nbsp;&nbsp;&nbsp;
          <div
            title={isRecording ? 'stop recording' : 'start recording'}
            style={buttonStyle}>
            {!isRecording ?
              <div onClick={this.startRecording}>&#9899;</div>
              :
              <div onClick={this.stopRecording}>&#9724;</div>
            }
          </div>
          <div onClick={this.onscreenshot} title={'snapshot'} style={buttonStyle}>&#8853;</div>
        </footer>
      </section>

    );
  }


}

interface VideoHlsProps {
  url_hls: string
  readyState: ReadyState
}


class VideoHls extends React.Component<VideoHlsProps, {}> {
  video: HTMLVideoElement
  hls: Hls

  shouldComponentUpdate(np) {
    return np.readyState == ReadyState.OPEN && np.readyState != this.props.readyState
  }

  componentWillUpdate(np) {
    this.mount(np.url_hls)
  }

  componentDidMount() {

    if (this.props.url_hls) {
      this.mount(this.props.url_hls)
    }

  }

  componentWillUnmount() {
    this.unmount()
  }

  unmount() {
    if (this.hls) {
      console.warn('destroying hls')
      this.hls.destroy()
    }
  }

  mount(url: string) {
    this.unmount()

    if (Hls.isSupported()) {
      var hls = this.hls = new Hls({
        // debug: true,
        manifestLoadingMaxRetry: 15,
        manifestLoadingMaxRetryTimeout: 1000,
        manifestLoadingTimeOut: 1000,
        enableWorker: true,
        autoStartLoad: true
      } as Hls.OptionalConfig);
      hls.attachMedia(this.video);
      hls.loadSource(url)
      // hls.loadSource('http://127.0.0.1:3040/play/hls/http/index.m3u8');
      // hls.loadSource('http://127.0.0.1:8080/play/hls/sintel/index.m3u8');

      hls.on(Hls.Events.ERROR, (event, data) => {
        // if (data.details === Hls.ErrorDetails.INTERNAL_EXCEPTION) {
        //   console.log('exception in ' + event + ',stack trace:' + JSON.stringify(data));
        // }
        if (data.type == Hls.ErrorTypes.MEDIA_ERROR && data.fatal) {
          // console.warn(data)
          console.warn('hls recovering after media error')
          hls.recoverMediaError()
        }
      })

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.warn('Hls.Events.MANIFEST_PARSED')
        this.video.play();
      });

      window['hls'] = hls
    }
  }


  render() {

    return (
      <video width="240" height="180" className="video-js vjs-default-skin" style={{ maxWidth: '100%' }} ref={r => this.video = r} autoPlay controls />
    )

  }

}


function saveToDevice(blob, name = 'unknown') {
  // console.warn('save to device')
  const fileName = blob.name || name
  const downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.href = window.URL.createObjectURL(blob);
  downloadLink.click();
}
