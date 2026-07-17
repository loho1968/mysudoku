import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
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
