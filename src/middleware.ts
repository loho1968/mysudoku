/**
 * @file middleware.ts
 * @author loho
 *
 * 全局中间件：为 /api/* 路径注入 CORS 响应头，允许本地源跨域访问。
 *
 * 用途：本地维护页面的「拉取/同步」按钮会从 localhost 向远程服务器发跨域请求，
 * 浏览器同源策略需要服务器在响应头中明确允许（OPTIONS 预检 + 实际请求）。
 *
 * 安全策略：
 * - 仅允许本地源（localhost / 127.0.0.1 / ::1 的任意端口）跨域访问
 * - 其他源（含公网域名）不返回 Access-Control-Allow-Origin，浏览器会拒绝跨域读取
 * - 不允许携带 cookie/credentials（同步场景不需要）
 */

import { NextResponse, type NextRequest } from "next/server";

/**
 * 本地源白名单正则：http://localhost[:port] / http://127.0.0.1[:port] / http://[::1][:port]
 * 不含 https（本地 dev 默认 http）；生产服务器不在白名单，自然被拒绝跨域。
 */
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * CORS 中间件。
 * @param request - Next.js 请求对象。
 * @returns NextResponse（注入了 CORS 头）。
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isLocalOrigin = LOCAL_ORIGIN_PATTERN.test(origin);

  // OPTIONS 预检：直接返回 204（不走到业务 handler）
  // 仅在 Origin 命中本地白名单时返回 CORS 头，否则给空响应（浏览器会拒绝）
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isLocalOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Edit-Password, X-Local-Dev"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  // 实际请求：先让业务 handler 处理，再注入 CORS 头
  const response = NextResponse.next();
  if (isLocalOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

/** 仅匹配 /api/* 路径（页面请求不经过此中间件）。 */
export const config = {
  matcher: "/api/:path*",
};
