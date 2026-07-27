import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: statik kabuk + Suspense akışı (PPR) ve "use cache".
  cacheComponents: true,
  experimental: {
    // Şemsiye radix-ui paketi varsayılan optimize listesinde değil;
    // (lucide-react ve recharts bu sürümde varsayılan olarak optimize).
    optimizePackageImports: ["radix-ui"],
  },
  async headers() {
    return [
      {
        // Service worker her zaman taze inmeli; eski sw takılı kalmasın.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
