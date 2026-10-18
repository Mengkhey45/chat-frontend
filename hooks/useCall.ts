import { useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useCallStore, CallType } from '@/store/callStore'
import * as rtc from '@/lib/webrtc'

const END_REASONS: Record<string, string> = {
  'no-answer': 'No answer',
  rejected: 'Call declined',
  'hung-up': 'Call ended',
  'peer-disconnected': 'Call disconnected',
  'callee-offline': 'User is offline',
  'callee-busy': 'User is currently on another call',
  'already-in-call': 'You are already in a call',
  'group-calls-unsupported': 'Group calls are coming soon',
  'not-a-participant': 'Unable to join call',
  'no-recipient': 'Recipient unavailable',
  failed: 'Call ended',
}

const store = useCallStore

/** The offer that arrived with an incoming call, held until the user accepts. */
let pendingOffer: RTCSessionDescriptionInit | null = null

/** Outgoing ICE candidates queued before the server returns a callId */
let pendingOutgoingCandidates: RTCIceCandidateInit[] = []

function emitOrQueueIceCandidate(socket: any, candidate: RTCIceCandidateInit) {
  const callId = store.getState().callId
  if (callId && socket?.connected) {
    socket.emit('call:ice', { callId, candidate })
  } else {
    pendingOutgoingCandidates.push(candidate)
  }
}

function flushOutgoingIceCandidates(socket: any, callId: string) {
  if (!socket?.connected || !callId) return
  while (pendingOutgoingCandidates.length > 0) {
    const candidate = pendingOutgoingCandidates.shift()
    if (candidate) {
      socket.emit('call:ice', { callId, candidate })
    }
  }
}

function cleanup(reason?: string | null) {
  rtc.closePeerConnection()
  pendingOffer = null
  pendingOutgoingCandidates = []
  const { setLocalStream, setRemoteStream, end } = store.getState()
  setLocalStream(null)
  setRemoteStream(null)
  end(reason ?? null)
  // Let the "call ended" state show briefly, then clear it.
  setTimeout(() => {
    if (store.getState().status === 'ended') store.getState().reset()
  }, 2500)
}

/**
 * Registers the WebRTC signalling listeners. Mount this in exactly ONE place
 * (CallOverlay) — mounting it twice would handle every signalling event twice.
 */
export function useCallSignaling() {
  const user = useAuthStore((s) => s.user)

  // Learn whether a TURN server is configured so the UI can warn about it.
  useEffect(() => {
    if (!user) return
    rtc.fetchIceServers().then(({ hasTurn }) => store.getState().setHasTurn(hasTurn))
  }, [user, store])

  // ---- signalling ----
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const onIncoming = (data: any) => {
      // Already busy: tell the caller rather than silently dropping it.
      if (store.getState().status !== 'idle') {
        socket.emit('call:reject', { callId: data.callId })
        return
      }
      pendingOffer = data.sdp
      store.getState().receiveIncoming(data.callId, data.conversationId, data.callType, data.from)
    }

    const onRinging = (data: any) => {
      store.getState().setCallId(data.callId)
      flushOutgoingIceCandidates(socket, data.callId)
    }

    const onAccepted = async (data: any) => {
      try {
        await rtc.acceptAnswer(data.sdp)
        store.getState().setStatus('connected')
      } catch {
        cleanup('failed')
      }
    }

    const onIce = (data: any) => {
      rtc.addIceCandidate(data.candidate)
    }

    const onEnded = (data: any) => {
      cleanup(END_REASONS[data?.reason] ?? 'Call ended')
    }

    const onFailed = (data: any) => {
      cleanup(END_REASONS[data?.reason] ?? 'Could not start the call')
    }

    socket.on('call:incoming', onIncoming)
    socket.on('call:ringing', onRinging)
    socket.on('call:accepted', onAccepted)
    socket.on('call:ice', onIce)
    socket.on('call:ended', onEnded)
    socket.on('call:failed', onFailed)

    return () => {
      socket.off('call:incoming', onIncoming)
      socket.off('call:ringing', onRinging)
      socket.off('call:accepted', onAccepted)
      socket.off('call:ice', onIce)
      socket.off('call:ended', onEnded)
      socket.off('call:failed', onFailed)
    }
  }, [user])

  // Release the camera and mic if the app unmounts mid-call.
  useEffect(() => () => rtc.closePeerConnection(), [])
}

/**
 * Call actions. Registers no listeners, so it is safe to use from any component
 * (the header's call buttons, the overlay's controls).
 */
export function useCallActions() {
  const user = useAuthStore((s) => s.user)

  const startCall = useCallback(
    async (callType: CallType) => {
      const socket = getSocket()
      const conversation = useChatStore.getState().currentConversation
      if (!socket?.connected || !conversation || !user) return

      if (conversation.type === 'group') {
        store.getState().end('Group calls are not supported yet')
        setTimeout(() => store.getState().reset(), 2500)
        return
      }

      const peerId = conversation.members.find((m) => m !== user.id)
      store.getState().startOutgoing(conversation.id, callType, {
        id: peerId ?? '',
        name: conversation.name,
        avatar: conversation.avatar,
      })

      try {
        const stream = await rtc.getLocalMedia(callType)
        store.getState().setLocalStream(stream)

        pendingOutgoingCandidates = []
        await rtc.createPeerConnection({
          onIceCandidate: (candidate) => emitOrQueueIceCandidate(socket, candidate),
          onRemoteStream: (remote) => store.getState().setRemoteStream(remote),
          onFailed: () => cleanup('failed'),
        })
        rtc.attachLocalStream(stream)

        const sdp = await rtc.createOffer()
        socket.emit('call:offer', { conversationId: conversation.id, callType, sdp })
      } catch (err: any) {
        cleanup(
          err?.name === 'NotAllowedError'
            ? 'Microphone/camera permission denied'
            : err?.message || 'Could not start the call'
        )
      }
    },
    [user]
  )

  const acceptCall = useCallback(async () => {
    const socket = getSocket()
    const { callId, callType } = store.getState()
    const offer = pendingOffer
    if (!socket?.connected || !callId || !offer) return

    store.getState().setStatus('connecting')
    try {
      const stream = await rtc.getLocalMedia(callType)
      store.getState().setLocalStream(stream)

      await rtc.createPeerConnection({
        onIceCandidate: (candidate) => socket.emit('call:ice', { callId, candidate }),
        onRemoteStream: (remote) => store.getState().setRemoteStream(remote),
        onFailed: () => cleanup('failed'),
      })
      rtc.attachLocalStream(stream)

      const answer = await rtc.createAnswer(offer)
      pendingOffer = null
      socket.emit('call:answer', { callId, sdp: answer })
      store.getState().setStatus('connected')
    } catch (err: any) {
      socket.emit('call:reject', { callId })
      cleanup(
        err?.name === 'NotAllowedError'
          ? 'Microphone/camera permission denied'
          : err?.message || 'Could not answer the call'
      )
    }
  }, [])

  const rejectCall = useCallback(() => {
    const socket = getSocket()
    const callId = store.getState().callId
    if (socket?.connected && callId) socket.emit('call:reject', { callId })
    pendingOffer = null
    cleanup(null)
    store.getState().reset()
  }, [])

  const endCall = useCallback(() => {
    const socket = getSocket()
    const callId = store.getState().callId
    if (socket?.connected && callId) socket.emit('call:end', { callId })
    cleanup(null)
    store.getState().reset()
  }, [])

  const toggleMic = useCallback(() => {
    const next = !store.getState().micEnabled
    rtc.setTrackEnabled('audio', next)
    store.getState().setMicEnabled(next)
  }, [])

  const toggleCamera = useCallback(() => {
    const next = !store.getState().cameraEnabled
    rtc.setTrackEnabled('video', next)
    store.getState().setCameraEnabled(next)
  }, [])

  return { startCall, acceptCall, rejectCall, endCall, toggleMic, toggleCamera }
}
