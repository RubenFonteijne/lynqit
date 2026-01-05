import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable strict mode for iframes to prevent upstream request timeout
  reactStrictMode: false,
  // Allow external iframes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://open.spotify.com https://www.youtube.com https://js.stripe.com https://hooks.stripe.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://api.stripe.com https://hooks.stripe.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
