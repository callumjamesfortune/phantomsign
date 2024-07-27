// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   env: {
//     GROQ_API_KEY: process.env.GROQ_API_KEY,
//   },
// };

// module.exports = nextConfig;


module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Custom webpack configurations (if any)
    return config;
  },
};

