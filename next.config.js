module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['phantomsign.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.filename = `static/chunks/[name].[contenthash].js`;
      config.output.chunkFilename = `static/chunks/[name].[contenthash].js`;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};
