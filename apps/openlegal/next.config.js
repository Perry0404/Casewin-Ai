/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Public, read-only API and MCP endpoint: allow calls from any origin.
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
