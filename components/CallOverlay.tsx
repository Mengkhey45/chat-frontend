'use client'

import { useEffect, useRef, useState } from 'react'
import { useCallStore } from '@/store/callStore'
import { useCallSignaling, useCallActions } from '@/hooks/useCall'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, AlertTriangle } from 'lucide-react'

/** Attaches a MediaStream to a <video> or <audio> element via callback ref and effect. */
function useStreamRef(stream: MediaStream | null, active?: boolean) {
  const ref = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream
    }
  }, [stream, active])

  const setRef = (node: HTMLVideoElement | HTMLAudioElement | null) => {
    ref.current = node
    if (node && node.srcObject !== stream) {
      node.srcObject = stream
    }
  }

  return setRef
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) {
      setSeconds(0)
      return
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function CallOverlay() {
  const status = useCallStore((s) => s.status)
  const callType = useCallStore((s) => s.callType)
  const peer = useCallStore((s) => s.peer)
  const endedReason = useCallStore((s) => s.endedReason)
  const micEnabled = useCallStore((s) => s.micEnabled)
  const cameraEnabled = useCallStore((s) => s.cameraEnabled)
  const localStream = useCallStore((s) => s.localStream)
  const remoteStream = useCallStore((s) => s.remoteStream)
  const hasTurn = useCallStore((s) => s.hasTurn)

  // Mounted once for the whole app, so this is where the signalling lives.
  useCallSignaling()
  const { acceptCall, rejectCall, endCall, toggleMic, toggleCamera } = useCallActions()

  const localRef = useStreamRef(localStream, status !== 'idle')
  const remoteRef = useStreamRef(remoteStream, status === 'connected')
  const elapsed = useElapsed(status === 'connected')

  if (status === 'idle') return null

  const isVideo = callType === 'video'
  const initial = (peer?.name || '?').charAt(0).toUpperCase()

  const statusLine =
    status === 'incoming'
      ? `Incoming ${callType} call`
      : status === 'outgoing'
        ? 'Calling…'
        : status === 'connecting'
          ? 'Connecting…'
          : status === 'connected'
            ? elapsed
            : (endedReason ?? 'Call ended')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${callType} call with ${peer?.name ?? 'unknown'}`}
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center"
    >
      {/* Remote video fills the screen once connected */}
      {isVideo && status === 'connected' && (
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Audio-only still needs an element to play the remote audio (avoiding display:none which suspends playback) */}
      {!isVideo && <audio ref={remoteRef} autoPlay playsInline className="sr-only" aria-hidden="true" />}

      {/* Identity card — shown until remote video arrives */}
      {(!isVideo || status !== 'connected') && (
        <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
          <Avatar className="w-28 h-28 ring-4 ring-white/10">
            <AvatarImage src={peer?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold text-white">{peer?.name || 'Unknown'}</h2>
            <p className="mt-1 text-sm text-white/60 tabular-nums">{statusLine}</p>
          </div>
        </div>
      )}

      {/* Local preview */}
      {isVideo && localStream && status !== 'incoming' && (
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-28 right-5 w-32 h-44 md:w-40 md:h-56 rounded-xl object-cover border-2 border-white/20 shadow-2xl bg-black"
        />
      )}

      {/* Timer overlay while on a connected video call */}
      {isVideo && status === 'connected' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur text-sm text-white/90 tabular-nums">
          {peer?.name} · {elapsed}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-10 z-10 flex items-center gap-4">
        {status === 'incoming' ? (
          <>
            <button
              onClick={rejectCall}
              aria-label="Decline call"
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              aria-label="Accept call"
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors animate-pulse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Phone className="w-6 h-6" />
            </button>
          </>
        ) : status === 'ended' ? null : (
          <>
            <button
              onClick={toggleMic}
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={!micEnabled}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                micEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white text-black'
              }`}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {isVideo && (
              <button
                onClick={toggleCamera}
                aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                aria-pressed={!cameraEnabled}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  cameraEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white text-black'
                }`}
              >
                {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={endCall}
              aria-label="End call"
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
