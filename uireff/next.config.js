/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.svg"],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Stub Node.js core modules that are not available in browsers but
      // occasionally pulled in as transitive deps (e.g. snarkjs -> ejs -> fs)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        assert: false,
        fastfile: false,
        ejs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
