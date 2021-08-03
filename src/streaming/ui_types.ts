import { Stream, Cams, ReadyState } from '@streaming/types'

export interface PlayerState {
  id: string
  isMoveControlsVisible: boolean
  wasMoveControlRequestSuccessful: boolean
  isRecording: boolean
  timeRecordingStarted: number
  timeRecordingCurrent: number
  timeRecordingDuration: number
  timeRecordingDurationString: string
}


export interface HlsStreamState {
  id: string
  wallCount: number
  player: PlayerState
  cam: Cams.CameraInfo
  state: Stream.State
}
