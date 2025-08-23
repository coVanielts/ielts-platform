/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '18.139.226.174',
        port: '8055',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: '18.139.226.174',
        port: '8055',
        pathname: '//assets/**',
      },
      {
        protocol: 'https',
        hostname: 'ielts-admin-7ic7j.ondigitalocean.app',
        pathname: '/**',
      },
    ],
  },
}
