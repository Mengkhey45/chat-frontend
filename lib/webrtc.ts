import api from '@/lib/api'

/**
 * The RTCPeerConnection and its media streams live here rather than in React
 * state: they are long-lived, mutable, and must survive re-renders untouched.
 * Only the derived UI state goes in the zustand store.
 */

let pc: RTCPeerConnection | null = null
let localStream: MediaStream | null = null

/** ICE candidates that arrive before the remote description is set. */
let pendingCandidates: RTCIceCandidateInit[] = []

let cachedIceServers: { iceServers: RTCIceServer[]; hasTurn: boolean } | null = null

export async function fetchIceServers() {
  if (cachedIceServers) return cachedIceServers
  try {
    const { data } = await api.get('/api/calls/ice-servers')
    cachedIceServers = { iceServers: data.iceServers, hasTurn: Boolean(data.hasTurn) }
  } catch {
    // Fall back to public STUN so same-network calls still work.
    cachedIceServers = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      hasTurn: false,
    }
  }
  return cachedIceServers
}

export function getPeerConnection(): RTCPeerConnection | null {
  return pc
}

export async function createPeerConnection(handlers: {
  onIceCandidate: (candidate: RTCIceCandidateInit) => void
  onRemoteStream: (stream: MediaStream) => void
  onFailed: () => void
}): Promise<RTCPeerConnection> {
  closePeerConnection()

  const { iceServers } = await fetchIceServers()
  pc = new RTCPeerConnection({ iceServers })
  pendingCandidates = []

  pc.onicecandidate = (event) => {
    if (event.candidate) handlers.onIceCandidate(event.candidate.toJSON())
  }

  pc.ontrack = (event) => {
    if (event.streams[0]) handlers.onRemoteStream(event.streams[0])
  }

  pc.onconnectionstatechange = () => {
    if (pc && (pc.connectionState === 'failed' || pc.connectionState === 'closed')) {
      handlers.onFailed()
    }
  }

  return pc
}

/**
 * Ask for the microphone (and camera for video calls).
 *
 * getUserMedia only works on a secure context — https, or localhost. On a LAN
 * IP over plain http the browser rejects it outright, which is the usual reason
 * calls "do nothing" in development.
 */
export async function getLocalMedia(callType: 'audio' | 'video'): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'Camera and microphone need a secure connection (https or localhost).'
    )
  }

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  })
  return localStream
}

export function attachLocalStream(stream: MediaStream) {
  if (!pc) return
  for (const track of stream.getTracks()) pc.addTrack(track, stream)
}

export async function createOffer(): Promise<RTCSessionDescriptionInit> {
  if (!pc) throw new Error('No peer connection')
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  return { type: 'offer', sdp: offer.sdp! }
}

export async function createAnswer(
  remoteOffer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  if (!pc) throw new Error('No peer connection')
  await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer))
  await drainCandidates()
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  return { type: 'answer', sdp: answer.sdp! }
}

export async function acceptAnswer(remoteAnswer: RTCSessionDescriptionInit) {
  if (!pc) return
  await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer))
  await drainCandidates()
}

export async function addIceCandidate(candidate: RTCIceCandidateInit) {
  if (!pc) return
  // Candidates can arrive before setRemoteDescription; queue them until then.
  if (!pc.remoteDescription) {
    pendingCandidates.push(candidate)
    return
  }
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  } catch {
    // A rejected candidate is not fatal; others usually succeed.
  }
}

async function drainCandidates() {
  if (!pc) return
  const queued = pendingCandidates
  pendingCandidates = []
  for (const c of queued) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c))
    } catch {
      /* ignore */
    }
  }
}

export function setTrackEnabled(kind: 'audio' | 'video', enabled: boolean) {
  if (!localStream) return
  for (const track of localStream.getTracks()) {
    if (track.kind === kind) track.enabled = enabled
  }
}

/** Release the camera/mic and tear down the connection. */
export function closePeerConnection() {
  if (localStream) {
    for (const track of localStream.getTracks()) track.stop()
    localStream = null
  }
  if (pc) {
    pc.onicecandidate = null
    pc.ontrack = null
    pc.onconnectionstatechange = null
    pc.close()
    pc = null
  }
  pendingCandidates = []
}
