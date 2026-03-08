/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://chat-backend-production-3d78.up.railway.app/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `https://chat-backend-production-3d78.up.railway.app/socket.io/:path*`,
      }
    ]
  }
}

export default nextConfig
