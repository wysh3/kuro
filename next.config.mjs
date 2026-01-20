/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=(), run-ad-auction=(), join-ad-interest-group=(), attribution-reporting=()',
          },
        ],
      },
    ];
  },
}

export default nextConfig
