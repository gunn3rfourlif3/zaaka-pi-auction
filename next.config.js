/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://sandbox.minepi.com https://app-cdn.minepi.com;" },
        ],
      },
    ];
  },
  // Ensure your experimental settings don't block ngrok
  experimental: {
    serverActions: {
      allowedOrigins: ["nondefinitely-fibrinogenic-talitha.ngrok-free.dev"],
    },
  },
};

module.exports = nextConfig;