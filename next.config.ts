import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // 子路径部署：nginx 反代 /sudoku/ 到本服务。
  // Next.js 会自动给路由/Link/redirect/静态资源加此前缀；
  // 但手写 fetch("/api/...") 不会自动加，需用 src/config/runtime.ts 的 api() 包裹。
  basePath: '/sudoku',
  // Explicitly acknowledge Turbopack usage. next-pwa injects a `webpack` key
  // into the config even when disabled, which Next.js 16 rejects without a
  // `turbopack` block. This silences the dev error without affecting the
  // `next build --webpack` PWA build (explicit flag still wins).
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
})(nextConfig);

export default pwaConfig;
