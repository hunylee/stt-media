import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // workspace root 경고 해결
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // 공통 라이브러리 import 최적화 (번들 크기/로드 시간 감소)
    optimizePackageImports: ['@google/generative-ai', '@supabase/supabase-js'],
  },
};

export default nextConfig;
