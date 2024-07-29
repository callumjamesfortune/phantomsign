// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   env: {
//     GROQ_API_KEY: process.env.GROQ_API_KEY,
//   },
// };

// module.exports = nextConfig;


// module.exports = {
//   reactStrictMode: true,
//   webpack: (config, { isServer }) => {
//     // Custom webpack configurations (if any)
//     return config;
//   },
// };

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-domain.com'],
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : '',
};


