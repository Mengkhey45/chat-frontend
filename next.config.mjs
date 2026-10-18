import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Where the API lives.
 *  - local dev (`pnpm dev` + chat-backend's unified-server): http://localhost:4000
 *  - docker-compose (nginx gateway in front of the microservices): http://localhost
 */
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const isDev = process.env.NODE_ENV !== 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // There is a stray package.json/pnpm-lock.yaml in the home directory, so Next
  // was inferring ~ as the workspace root. Pin it to this project.
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    // Same-origin by default. `unsafe-inline`/`unsafe-eval` on scripts are what
    // Next's dev overlay and runtime require; the production build only needs
    // 'unsafe-inline' for its inline bootstrap. Tighten with a nonce if you later
    // move to a custom server.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com" + (isDev ? " 'unsafe-eval'" : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      // The API and websocket. Widen this if you host the backend elsewhere.
      `connect-src 'self' ${backendUrl} ${backendUrl.replace(/^http/, 'ws')} https://va.vercel-scripts.com`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here needs these, and calls ask for camera/mic explicitly.
          { key: 'Permissions-Policy', value: 'geolocation=(), interest-cohort=(), payment=()' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${backendUrl}/socket.io/:path*` },
    ]
  },
}

export default nextConfig
