import { create } from 'zustand'

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected' | 'ended'
export type CallType = 'audio' | 'video'

export interface CallPeer {
  id: string
  name: string
  avatar?: string
}

export interface CallState {
  status: CallStatus
  callId: string | null
  conversationId: string | null
  callType: CallType
  peer: CallPeer | null
  /** Set when the call ends for a reason worth showing the user. */
  endedReason: string | null
  micEnabled: boolean
  cameraEnabled: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  /** False when no TURN server is configured — calls may fail on some networks. */
  hasTurn: boolean

  startOutgoing: (conversationId: string, callType: CallType, peer: CallPeer | null) => void
  receiveIncoming: (callId: string, conversationId: string, callType: CallType, peer: CallPeer) => void
  setCallId: (callId: string) => void
  setStatus: (status: CallStatus) => void
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteStream: (stream: MediaStream | null) => void
  setMicEnabled: (on: boolean) => void
  setCameraEnabled: (on: boolean) => void
  setHasTurn: (v: boolean) => void
  end: (reason?: string | null) => void
  reset: () => void
}

const initial = {
  status: 'idle' as CallStatus,
  callId: null,
  conversationId: null,
  callType: 'audio' as CallType,
  peer: null,
  endedReason: null,
  micEnabled: true,
  cameraEnabled: true,
  localStream: null,
  remoteStream: null,
}

export const useCallStore = create<CallState>((set) => ({
  ...initial,
  hasTurn: false,

  startOutgoing: (conversationId, callType, peer) =>
    set({
      ...initial,
      status: 'outgoing',
      conversationId,
      callType,
      peer,
      cameraEnabled: callType === 'video',
    }),

  receiveIncoming: (callId, conversationId, callType, peer) =>
    set({
      ...initial,
      status: 'incoming',
      callId,
      conversationId,
      callType,
      peer,
      cameraEnabled: callType === 'video',
    }),

  setCallId: (callId) => set({ callId }),
  setStatus: (status) => set({ status }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  setHasTurn: (hasTurn) => set({ hasTurn }),

  end: (reason = null) => set({ status: 'ended', endedReason: reason }),
  reset: () => set({ ...initial }),
}))
