import { io, Socket } from 'socket.io-client'

// Singleton socket instance shared across all components
let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string, userId: string): Socket {
  if (socket?.connected) {
    return socket
  }

  // Disconnect stale socket if any
  if (socket) {
    socket.disconnect()
  }

  const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')

  socket = io(GATEWAY_URL, {
    path: '/socket.io/',
    auth: { token, userId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected, id:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
