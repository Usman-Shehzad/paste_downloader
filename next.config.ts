import type { NextConfig } from "next";

// In dev the FastAPI server runs on :8000; on Vercel /api/index.py serves /api/py/*.
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/:path*"
            : "/api/",
      },
    ];
  },
  images: { unoptimized: true },
};

export default nextConfig;
