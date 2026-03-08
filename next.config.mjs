/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
    
    return [
      {
        source: '/api/:path*',
        destination: `${GATEWAY_URL}/api/:path*`, 
      },
    ];
  },
}

export default nextConfig
