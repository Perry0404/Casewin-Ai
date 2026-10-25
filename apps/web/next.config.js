/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
  // Court infrastructure moved to its own app at court.casewinai.com.
  async redirects() {
    const court = process.env.NEXT_PUBLIC_COURT_URL || 'https://court.casewinai.com'
    return [
      { source: '/court', destination: court, permanent: true },
      { source: '/court/analytics', destination: `${court}/#analytics`, permanent: true },
      { source: '/court/evidence', destination: `${court}/verify`, permanent: true },
      { source: '/court/:path*', destination: court, permanent: true },
      { source: '/tools/filing', destination: `${court}/file`, permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
