# mysudoku — 项目计划

> 版本: 1.0 | 日期: 2026-07-16 | 状态: 需求分析完成、待开发

---

## 一、项目概述

**mysudoku** 是一个个人学习和练习数独的单页面网站（PWA），部署在腾讯云轻量服务器上，通过 SSH 远程开发。

### 1.1 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 框架 | Next.js 14+ (App Router) | SSR/SSG + API Routes |
| UI | Ant Design 5.x | 组件库，配合 ant-design-cli MCP |
| 样式 | CSS Modules + Ant Design Token | 不使用 Tailwind |
| 数据库 | SQLite (better-sqlite3) | 单文件，零运维 |
| 状态管理 | React Context + useReducer | 不引入外部库 |
| PWA | @ducanh2912/next-pwa | Service Worker + Manifest |
| 部署 | PM2 7.0.3 | 进程守护 |
| 开发 | SSH (ssh tencent) | 远程服务器直接开发 |
| 版本管理 | Git (GitHub) | loho1968/mysudoku.git |

### 1.2 部署信息

| 项 | 值 |
|----|-----|
| 服务器 | 腾讯云轻量 OpenCloudOS 9.2 |
| 项目路径 | `/opt/mysudoku` |
| 数据库 | `/opt/mysudoku/data/mysudoku.db` |
| Node 版本 | v24.18.0 (nvm) |
| 端口 | 3000 |

---

## 二、核心功能

### 2.1 数独游戏页面

| # | 功能 | 详情 |
|---|------|------|
| 1 | 棋盘渲染 | div+CSS 布局，9×9 网格，3×3 宫框加粗 |
| 2 | 响应式 | 桌面端/手机端自适应，桌面端可调字体大小 |
| 3 | 数字输入 | ① 选单元格→点数字/按键盘；② 双击数字→粘滞模式→连续点单元格 |
| 4 | 多选 | Ctrl/Cmd+点击 切换，Shift+点击 范围选择 |
| 5 | 高亮系统 | 选中格→行/列浅蓝底；有数字→同数字浅黄底；初始数字黑体加粗 |
| 6 | 模式切换 | 答题模式 / 笔记模式 |
| 7 | 计时器 | 开始/暂停/重置，记录做题时长 |
| 8 | 错误检查 | 手动触发，只提示「有/无」错误，不显示位置 |
| 9 | 撤销/重做 | 记录每步操作（含笔记操作），支持依次撤销 |

### 2.2 笔记系统（三层）

| 类型 | 说明 | 触发 | 复杂度 |
|------|------|------|--------|
| **普通笔记** | 简单排除：同行/列/宫已有数字 → 从候选数移除 | 自动（每次操作后） | O(n) |
| **笔记自动更新** | 答案/撤销后，重新计算受影响单元格的普通笔记 | 自动（同行/列/宫27格） | O(n) |
| **智能笔记** | 技巧推理：唯余→摒除→区块→显性数组，逐步筛减候选数 | 手动（按钮触发） | O(n²) |

- 普通笔记是基础层，永远保持最新
- 智能笔记是增强层，在普通笔记上叠加推理
- 棋盘变更后智能笔记标记「过期」，需手动重新触发
- 显示优先级：智能笔记 > 普通笔记

### 2.3 强弱链图

- Canvas 绝对定位覆盖层（z-index 高于棋盘）
- 实线=强链，虚线=弱链，箭头标注方向，候选数标签
- 操作流程：选择链类型 → 点击起止单元格 → 选择候选数
- 支持多条链、不同颜色、清除全部

### 2.4 题目管理（编辑模式）

| # | 功能 | 详情 |
|---|------|------|
| 1 | 导入 | 剪贴板粘贴，自动识别 81字符/9行两种格式 |
| 2 | 列表 | 分页表格，支持难度/标签筛选、关键词搜索 |
| 3 | 编辑 | 修改题目、难度、标签、备注 |
| 4 | 删除 | 级联删除关联标签（多对多中间表） |
| 5 | 标签 | 独立 CRUD，多对多关联题目 |

### 2.5 浏览/编辑模式

- 浏览模式（默认）：所有增删改按钮隐藏，`/puzzles` 页面重定向
- 编辑模式：输入密码验证（默认 `mysudoku`），sessionStorage 存储
- API 层验证：`X-Edit-Password` 请求头

### 2.6 PWA 离线

- Service Worker: 静态资源 Cache-First，API Network-First
- localStorage 存储：游戏进度、用户设置
- 可安装到桌面，离线可用核心游戏功能

---

## 三、数据模型

### 3.1 SQLite Schema

```sql
-- 题目表
CREATE TABLE puzzles (
    id          TEXT PRIMARY KEY,           -- UUID v4
    puzzle      TEXT NOT NULL,              -- 81字符 (0=空格)
    solution    TEXT,                       -- 答案 (可为NULL)
    difficulty  INTEGER DEFAULT 0,          -- 0未分类 1简单 2中等 3困难 4专家
    source      TEXT,                       -- 来源
    remark      TEXT,                       -- 备注
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    _modified   INTEGER DEFAULT 1
);

-- 标签表
CREATE TABLE tags (
    id          TEXT PRIMARY KEY,           -- UUID v4
    name        TEXT NOT NULL UNIQUE,       -- 技巧名
    color       TEXT DEFAULT '#1890ff',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    _modified   INTEGER DEFAULT 1
);

-- 题目-标签关联
CREATE TABLE puzzle_tags (
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (puzzle_id, tag_id)
);

-- 做题记录
CREATE TABLE game_records (
    id            TEXT PRIMARY KEY,
    puzzle_id     TEXT NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    time_seconds  INTEGER,
    completed     INTEGER DEFAULT 0,
    hint_used     INTEGER DEFAULT 0,
    check_errors  INTEGER DEFAULT 0,
    started_at    TEXT DEFAULT (datetime('now')),
    finished_at   TEXT,
    _modified     INTEGER DEFAULT 1
);

-- 设置
CREATE TABLE settings (
    key       TEXT PRIMARY KEY,
    value     TEXT NOT NULL,
    _modified INTEGER DEFAULT 1
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('edit_password', 'mysudoku');
```

### 3.2 localStorage 结构

```typescript
// 游戏进度: mysudoku_game_progress
interface LocalProgress {
  puzzleId: string;
  grid: { value: number|null; isGiven: boolean; notes: number[] }[][];
  steps: Step[];
  currentStepIndex: number;
  showNotes: boolean;
  noteType: 'none' | 'normal' | 'smart';
  chains: ChainLink[];
  elapsedSeconds: number;
  timerRunning: boolean;
  savedAt: number;
}

// 用户设置: mysudoku_settings
interface UserSettings {
  fontSize: number;        // 默认 24
}
```

---

## 四、API 路由

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/puzzles` | 题目列表(分页/搜索/筛选) | 公开 |
| POST | `/api/puzzles` | 添加题目 | 编辑 |
| GET | `/api/puzzles/[id]` | 题目详情 | 公开 |
| PUT | `/api/puzzles/[id]` | 更新题目 | 编辑 |
| DELETE | `/api/puzzles/[id]` | 删除题目 | 编辑 |
| POST | `/api/puzzles/import` | 批量导入(剪贴板) | 编辑 |
| GET | `/api/tags` | 标签列表 | 公开 |
| POST | `/api/tags` | 添加标签 | 编辑 |
| PUT | `/api/tags/[id]` | 更新标签 | 编辑 |
| DELETE | `/api/tags/[id]` | 删除标签 | 编辑 |
| POST | `/api/auth` | 验证编辑密码 | 公开 |

---

## 五、页面路由

| 路径 | 说明 | 权限 |
|------|------|------|
| `/` | 重定向到 /game | 公开 |
| `/game` | 游戏主页面 | 公开 |
| `/game/[id]` | 加载指定题目 | 公开 |
| `/puzzles` | 题目管理 | 编辑模式 |

---

## 六、项目结构

```
mysudoku/
├── .ai/
│   ├── requirements.md    # 详细技术需求
│   ├── DECISIONS.md       # 架构决策
│   ├── CONTEXT.md         # 项目背景
│   ├── 下班交接.md         # 交接模板
│   └── 接班继续.md         # 接班模板
├── PLAN.md                # 本文件
├── data/                  # SQLite 数据目录（部署时创建）
├── public/
│   ├── manifest.json      # PWA
│   └── icons/             # PWA 图标
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # 根布局 (ConfigProvider)
│   │   ├── globals.css
│   │   ├── page.tsx       # 首页 (→/game)
│   │   ├── game/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── puzzles/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── puzzles/   # [route.ts, [id]/route.ts, import/route.ts]
│   │       ├── tags/      # [route.ts, [id]/route.ts]
│   │       └── auth/route.ts
│   ├── components/
│   │   ├── Layout/        # AppHeader, AppFooter
│   │   ├── SudokuGrid/    # SudokuGrid, Cell, ChainCanvas, NotesLayer
│   │   ├── Controls/      # NumberPad, GameToolBar, ModeTabs
│   │   ├── Timer/         # GameTimer
│   │   ├── PuzzleManager/ # PuzzleTable, PuzzleForm, ImportModal, TagManager
│   │   ├── Auth/          # EditModeModal
│   │   ├── EditMode/      # EditModeToggle
│   │   ├── ChainBuilder/  # ChainToolbar
│   │   └── Settings/      # FontSizeSlider
│   ├── hooks/
│   │   ├── useGame.ts
│   │   ├── useGameTimer.ts
│   │   ├── useCellSelection.ts
│   │   ├── useStickyInput.ts
│   │   ├── useSteps.ts
│   │   ├── useHighlights.ts
│   │   ├── useAutoNotes.ts      # 笔记自动更新
│   │   ├── useSmartNotes.ts     # 智能笔记（手动触发）
│   │   ├── useLocalProgress.ts
│   │   ├── useEditMode.ts
│   │   ├── useChainDrawing.ts
│   │   └── useKeyboard.ts
│   ├── lib/
│   │   ├── db.ts                # SQLite 连接单例
│   │   ├── sudoku/
│   │   │   ├── types.ts
│   │   │   ├── board.ts         # 棋盘操作
│   │   │   ├── validator.ts     # 合法性校验
│   │   │   ├── candidates.ts    # 候选数计算
│   │   │   ├── parser.ts        # 题目文本解析
│   │   │   ├── chains.ts        # 强弱链分析
│   │   │   └── techniques/
│   │   │       ├── index.ts
│   │   │       ├── nakedSingle.ts
│   │   │       ├── hiddenSingle.ts
│   │   │       ├── pointingPair.ts
│   │   │       ├── boxLineReduction.ts
│   │   │       ├── nakedSubset.ts
│   │   │       └── hiddenSubset.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── sudoku.ts
│   │   ├── api.ts
│   │   └── game.ts
│   └── config/
│       └── constants.ts
├── ecosystem.config.js    # PM2 配置
├── next.config.js
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 七、核心实现要点

### 7.1 棋盘渲染

- 纯 div+CSS（不用 table/canvas），性能好、无障碍、事件处理简单
- 宫框加粗通过 CSS border 实现（第3/6列 border-right 加粗，第3/6行 border-bottom 加粗）
- 字体大小通过 CSS 变量 `--cell-font-size` 控制

### 7.2 高亮系统

```
选中 (row,col) 时:
├── 该行全部 9 格 → .row-highlight (浅蓝 #e6f4ff)
├── 该列全部 9 格 → .col-highlight (浅蓝 #e6f4ff)
├── 该格 value 非空 → 全局同数字格 → .same-number (浅黄 #fff7e6)
└── 该格本身 → .selected (蓝框 inset shadow)
```

### 7.3 步骤撤销

```
Step = { changes: [{row, col, prevValue, prevNotes, newValue, newNotes}] }

操作 → 记录 Step → push 到 steps[]
       ↓
       丢弃 currentStepIndex 之后的历史（新分支）
       ↓
撤销: currentStepIndex 回退，恢复 prevValue/prevNotes
```

### 7.4 编辑模式

```
sessionStorage['edit_password'] → 所有 API 请求自动附加 X-Edit-Password header
                                  ↓
                              服务端 verifyEditMode() 中间件校验
                                  ↓
                              密码 = settings 表 edit_password 值
```

### 7.5 PWA 离线策略

| 资源类型 | 策略 |
|----------|------|
| HTML/JS/CSS | Cache-First |
| API 请求 | Network-First → 失败回退缓存 |
| 游戏进度 | localStorage（完全离线） |
| 题目数据 | API 缓存 → 离线可用 |

---

## 八、开发环境

### 8.1 SSH 远程开发

```bash
# 连接
ssh tencent
cd /opt/mysudoku

# 开发模式
npm run dev -- -p 3000

# codegraph
npx codegraph init        # 首次
npx codegraph sync         # 每次修改后
```

### 8.2 ant-design-cli MCP

```json
{
  "mcpServers": {
    "ant-design-cli": {
      "command": "npx",
      "args": ["-y", "@ant-design/cli", "mcp"]
    }
  }
}
```

### 8.3 开发规范

1. 每次代码修改后执行 `codegraph sync`（或 `npm run s:sync`）
2. 本项目优先使用 codegraph 搜索代码结构
3. 使用 ant-design-cli MCP 查询 antd 组件
4. 下班前：npm run build → git push → 生成交接文档
5. 接班时：git pull → 阅读交接文档 → 确认环境

---

## 九、部署

### 9.1 PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mysudoku',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/mysudoku',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_PATH: '/opt/mysudoku/data/mysudoku.db',
    },
    error_file: '/opt/mysudoku/logs/error.log',
    out_file: '/opt/mysudoku/logs/out.log',
    max_memory_restart: '512M',
    autorestart: true,
  }],
};
```

### 9.2 部署命令

```bash
ssh tencent
cd /opt/mysudoku
git pull
npm install
npm run build
pm2 restart mysudoku
```

---

## 十、开发阶段

| 阶段 | 内容 | 关键产出 |
|------|------|----------|
| 一 | 项目脚手架 + 数据库 + 基础 API | 项目可运行，API 可用 |
| 二 | 棋盘组件 + 基础交互 | 可看题、填数字、高亮 |
| 三 | 笔记系统 + 智能笔记算法 | 普通/智能笔记完成 |
| 四 | 步骤撤销 + 计时器 | Undo/Redo + 计时 |
| 五 | 强弱链图 | Canvas 绘制层 |
| 六 | 题目管理 | CRUD + 导入 + 标签 |
| 七 | 编辑/浏览模式 | 密码切换 |
| 八 | PWA + 离线 + 进度保存 | 可安装，离线可用 |
| 九 | 响应式 + 字体设置 + 移动端 | 全端适配 |
| 十 | 部署 + 测试 | PM2 上线 |

---

## 十一、未纳入阶段一（后续）

- 文件批量上传题目
- 图片 OCR 识别
- 自动求解器
- 提示系统
- 用户/多用户
- 统计分析
- 深色模式
- 国际化

---

> 本文档为 mysudoku 项目的开发计划总纲。
> 详细技术设计见 `.ai/requirements.md`，架构决策见 `.ai/DECISIONS.md`。
