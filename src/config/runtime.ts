/**
 * @file runtime.ts
 * @author loho
 *
 * 运行时路径工具：为手写的 fetch / window.location 等加上 basePath 前缀。
 *
 * Next.js 配 `basePath` 后，<Link>、router.push、redirect、<Image>、静态资源
 * 都会自动加前缀；但**手写 fetch("/api/...") 不会**，必须用本文件的 api() 包裹。
 *
 * NEXT_PUBLIC_BASE_PATH 由 Next.js 构建时自动注入（值等于 next.config.ts 的 basePath）。
 */

/** 应用 basePath，如 "/sudoku"。无 basePath 时为空串。 */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * 给 API 路径加 basePath 前缀。
 *
 * 用法：`fetch(api("/api/puzzles/all"))`
 *
 * @param path - 形如 "/api/..." 的路径（必须以 / 开头）。
 * @returns 加了 basePath 前缀的完整路径。
 */
export function api(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`api() 路径必须以 / 开头，收到: ${path}`);
  }
  return `${BASE_PATH}${path}`;
}
