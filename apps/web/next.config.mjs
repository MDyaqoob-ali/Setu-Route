/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["images.unsplash.com", "tile.openstreetmap.org"],
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8008/api/v1/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:8008/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
