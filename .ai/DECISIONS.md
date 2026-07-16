# DECISIONS.md — 架构决策记录

> 记录项目开发过程中的关键架构决策，便于后续回顾和理解

---

## 决策列表

| 编号 | 日期 | 决策 | 理由 |
|------|------|------|------|
| D-001 | 2025-07-16 | 使用 Next.js App Router (而非 Pages Router) | 更现代的架构，支持 Server Components、React 18+ 特性，适合 PWA |
| D-002 | 2025-07-16 | 使用 better-sqlite3 (而非 drizzle-orm/prisma) | 轻量、同步 API 适合 SQLite，减少依赖复杂度 |
| D-003 | 2025-07-16 | 使用 React Context + useReducer (而非 Zustand/Redux) | 单页面状态简单，无需引入外部状态管理库 |
| D-004 | 2025-07-16 | 使用 @ducanh2912/next-pwa (而非 next-pwa) | next-pwa 已不维护，@ducanh2912 是活跃维护的 fork |
| D-005 | 2025-07-16 | 编辑模式使用 sessionStorage + X-Edit-Password header | 简单无状态方案，无需 JWT/session，适合单用户场景 |
| D-006 | 2025-07-16 | 游戏进度使用 localStorage 存储 (而非服务器) | 用户选择本地存储，简化架构，支持离线 |
| D-007 | 2025-07-16 | 所有 ID 使用 UUID v4 (string 类型) | 跨系统兼容，便于未来数据同步 |
| D-008 | 2025-07-16 | 棋盘使用 div+CSS 布局 (而非 canvas) | 支持无障碍、CSS 动画、文本选中、响应式更好 |
| D-009 | 2025-07-16 | 强弱链使用 Canvas 覆盖层 | 需要自由绘制连线/箭头，canvas 是最佳选择 |
| D-010 | 2025-07-16 | 智能笔记采用分层策略（基础→唯余→摒除→区块→显性数组） | 从简单到复杂渐进计算，平衡准确性和性能 |

---

## D-001: 框架选型 — Next.js App Router

**决策时间:** 2025-07-16
**状态:** ✅ 已确认

### 背景
需要选择一个现代化的 React 框架，支持 SSR/PWA/API Routes。

### 选项对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. Next.js App Router | 官方推荐，React Server Components，PWA 生态好 | 学习曲线略高 |
| B. Next.js Pages Router | 成熟稳定 | 老旧，不支持新特性 |
| C. Vite + React | 轻量快速 | 需自行实现 SSR/API/PWA |
| D. Remix | Web 标准友好 | 生态不如 Next.js |

### 决策
选择 **A. Next.js App Router**，理由：
- 与 Ant Design 5.x 兼容性好
- PWA 生态成熟（@ducanh2912/next-pwa）
- API Routes 可直接使用 better-sqlite3
- 未来可扩展 SSR

---

## D-002: 数据库 — better-sqlite3

**决策时间:** 2025-07-16
**状态:** ✅ 已确认

### 背景
需要选择一个 SQLite 库用于 Next.js API Routes。SQLite 是同步数据库，在 Node.js 中需要同步 API。

### 选项对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. better-sqlite3 | 同步、高性能、原生 C++ | 需编译原生模块 |
| B. sql.js | 纯 JS/WASM，无原生依赖 | 性能较差 |
| C. bun:sqlite | Bun 原生支持 | 不兼容 Node.js |

### 决策
选择 **A. better-sqlite3**，理由：
- Node.js v24 环境编译简单
- 同步 API 与 Next.js API Routes 完美配合
- 性能优于纯 JS 方案

---

## D-003: 状态管理 — Context + useReducer

**决策时间:** 2025-07-16
**状态:** ✅ 已确认

### 背景
游戏页面需要管理复杂的棋盘状态、步骤历史、高亮状态等。

### 选项对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. Context + useReducer | 零依赖、类型安全 | 需手动优化渲染 |
| B. Zustand | 轻量、性能好 | 额外依赖 |
| C. Redux Toolkit | 生态完善 | 过于重型 |
| D. Jotai | 原子化状态 | 额外依赖 |

### 决策
选择 **A. Context + useReducer**，理由：
- 单页面应用，状态树不复杂
- 零额外依赖，减少 bundle size
- TypeScript 完善的类型推导
- 用 useMemo 优化渲染即可满足需求

---

## D-005: 编辑模式实现 — sessionStorage + Header

**决策时间:** 2025-07-16
**状态:** ✅ 已确认

### 背景
需要一种简单的方式在浏览模式和编辑模式之间切换，编辑模式需要密码验证。

### 决策
使用 sessionStorage 存储密码，API 请求通过 `X-Edit-Password` header 传递。
- 无需 JWT/OAuth 等复杂认证机制
- 关闭浏览器即退出编辑模式
- API 层中间件统一校验

---

## D-007: ID 策略 — UUID v4 String

**决策时间:** 2025-07-16
**状态:** ✅ 已确认

### 背景
数据模型需要统一 ID 策略，便于未来多设备同步。

### 决策
所有表主键使用 UUID v4（36字符 string），使用 `crypto.randomUUID()` 生成。
- 跨系统唯一，无需中心化 ID 生成
- 字符串类型便于 JSON 传输
- 为未来数据同步预留空间

---

> 新增决策请按编号追加，更新已有决策时保留变更历史。
