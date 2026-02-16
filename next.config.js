/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This allows the Pi Browser tunnel to communicate with your local server
  experimental: {
    allowedDevOrigins: ["nondefinitely-fibrinogenic-talitha.ngrok-free.dev"],
  },
};

module.exports = nextConfig;