/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir requisições externas ao ViaCEP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://viacep.com.br",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
