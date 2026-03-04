import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const ocrCdnHosts = "https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com";
    const connectSrc = isDevelopment
      ? `connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* ws://127.0.0.1:* ${ocrCdnHosts};`
      : `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${ocrCdnHosts};`;

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' ${ocrCdnHosts} blob:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; ${connectSrc} img-src 'self' data: blob:; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
