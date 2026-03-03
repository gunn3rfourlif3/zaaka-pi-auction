/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { 
            key: "Content-Security-Policy", 
            // Broad and permissive CSP for development
            value: "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://sandbox.minepi.com https://app-cdn.minepi.com https://*.minepi.com; img-src * data: blob:; font-src * data:; style-src * 'unsafe-inline';" 
          },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
  // Ensure your experimental settings don't block ngrok
  experimental: {
    serverActions: {
      allowedOrigins: [
        "nondefinitely-fibrinogenic-talitha.ngrok-free.dev",
        "https://sandbox.minepi.com",
        "https://app-cdn.minepi.com"
      ],
    },
  },
};

module.exports = nextConfig;