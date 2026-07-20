/**
 * @file env.ts
 * @author loho
 *
 * 运行环境判定工具。
 *
 * 区分「本地开发机」与「部署服务器」：
 * - 本地：访问地址 hostname 为 localhost / 127.0.0.1 / ::1
 * - 服务器：其他域名（含本机 build 后用 IP 访问的情况由用户自己管理）
 *
 * 本地环境下，/puzzles 维护页面自动进入维护模式（免密），并提供「拉取/同步」
 * 按钮与远程服务器交互；部署到服务器后回退为密码验证模式。
 */

/**
 * 判定当前是否在本地开发环境（仅客户端可用）。
 *
 * 通过 window.location.hostname 判定，避免依赖 NODE_ENV（本机 build 启动也算本地）。
 * SSR 时返回 false（无 window 对象）。
 *
 * @returns 是否为本地环境。
 */
export function isLocalEnv(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * 服务端判定请求是否来自本地环境。
 *
 * 通过请求 Host 头判断。仅 API 路由使用，配合 X-Local-Dev 头做双层校验：
 * 客户端在本地时由 apiFetch 自动注入 X-Local-Dev: 1。
 *
 * @param request - Next.js API 请求对象。
 * @returns 是否为本地环境请求。
 */
export function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

/**
 * 本地旁路标识头名。
 * 客户端 apiFetch 在本地环境自动附加此头（值为 "1"），
 * 服务端 verifyEditMode 见此头 + isLocalRequest 双重确认即放行。
 */
export const LOCAL_DEV_HEADER = "X-Local-Dev";
