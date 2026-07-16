# mysudoku 开发需求文档

> 版本: 1.0  
> 最后更新: 2025-07-16  
> 状态: 待开发

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目目录结构](#2-项目目录结构)
3. [数据库 Schema](#3-数据库-schema)
4. [API 路由设计](#4-api-路由设计)
5. [组件树设计](#5-组件树设计)
6. [数据流设计](#6-数据流设计)
7. [路由设计](#7-路由设计)
8. [关键功能实现要点](#8-关键功能实现要点)
9. [部署配置](#9-部署配置)
10. [开发环境配置](#10-开发环境配置)
11. [附录](#11-附录)

---

## 1. 项目概述

### 1.1 项目简介

**mysudoku** 是一个个人学习和练习数独的单页面网站,提供完整的数独解题体验。

### 1.2 技术栈

| 层次       | 技术选型                                   |
| ---------- | ------------------------------------------ |
| 前端框架   | Next.js 14+ (App Router)                   |
| UI 组件库  | Ant Design 5.x                             |
| CSS 方案   | Ant Design 内置样式 + CSS Modules          |
| 数据库     | SQLite (better-sqlite3)                    |
| 状态管理   | React Context + useReducer (客户端状态)    |
| PWA        | @ducanh2912/next-pwa                       |
| 运行时     | Node.js v24.18.0                           |
| 进程管理   | PM2 7.0.3                                  |
| 服务器系统 | TencentOS / OpenCloudOS 9.2                |
| 版本管理   | Git (GitHub: loho1968/mysudoku.git)        |
| 远程开发   | SSH (ssh tencent)                          |

### 1.3 部署路径

| 路径              | 用途          |
| ----------------- | ------------- |
| `/opt/mysudoku`   | 项目根目录    |
| `/opt/mysudoku/data/mysudoku.db` | SQLite 数据库 |

---

## 2. 项目目录结构

```
mysudoku/
├── .ai/                             # AI 上下文目录
│   ├── DECISIONS.md                 # 架构决策记录
│   ├── CONTEXT.md                   # 项目背景
│   ├── requirements.md              # 本需求文档
│   ├── 下班交接.md                   # 下班前总结模板
│   └── 接班继续.md                   # 接班后恢复模板
├── data/                            # 数据目录（部署时自动创建）
│   └── mysudoku.db                  # SQLite 数据库文件
├── public/                          # 静态资源
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service Worker（由 next-pwa 生成）
│   └── icons/                       # PWA 图标
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src/
│   ├── app/                         # Next.js App Router 页面
│   │   ├── layout.tsx               # 根布局（Ant Design ConfigProvider + 全局样式）
│   │   ├── page.tsx                 # 首页（重定向到 /game）
│   │   ├── globals.css              # 全局样式
│   │   ├── game/                    # 游戏页面
│   │   │   ├── page.tsx             # 游戏主页面
│   │   │   └── [id]/               # 加载指定题目
│   │   │       └── page.tsx
│   │   ├── puzzles/                 # 题目管理页面
│   │   │   └── page.tsx
│   │   └── api/                     # API 路由
│   │       ├── puzzles/
│   │       │   ├── route.ts         # GET(列表) POST(添加)
│   │       │   ├── [id]/
│   │       │   │   └── route.ts     # GET PUT DELETE
│   │       │   └── import/
│   │       │       └── route.ts     # POST(批量导入)
│   │       ├── tags/
│   │       │   ├── route.ts         # GET(列表) POST(添加)
│   │       │   └── [id]/
│   │       │       └── route.ts     # PUT DELETE
│   │       └── auth/
│   │           └── route.ts         # POST(验证编辑密码)
│   ├── components/                  # React 组件
│   │   ├── Layout/
│   │   │   ├── AppHeader.tsx        # 顶部导航栏
│   │   │   └── AppFooter.tsx        # 底部信息栏
│   │   ├── SudokuGrid/              # 数独棋盘组件
│   │   │   ├── SudokuGrid.tsx       # 棋盘容器（含 Canvas 覆盖层）
│   │   │   ├── Cell.tsx             # 单个单元格
│   │   │   ├── ChainCanvas.tsx      # 强弱链 Canvas 绘制层
│   │   │   └── NotesLayer.tsx       # 笔记候选数渲染层
│   │   ├── Controls/                # 游戏控制组件
│   │   │   ├── NumberPad.tsx        # 数字输入面板
│   │   │   ├── GameToolBar.tsx      # 工具栏（撤销/橡皮擦/笔记开关等）
│   │   │   └── ModeTabs.tsx         # 笔记模式/答题模式切换
│   │   ├── Timer/                   # 计时器组件
│   │   │   └── GameTimer.tsx
│   │   ├── PuzzleManager/           # 题目管理组件
│   │   │   ├── PuzzleTable.tsx      # 题目列表表格
│   │   │   ├── PuzzleForm.tsx       # 题目新增/编辑表单
│   │   │   ├── ImportModal.tsx      # 剪贴板导入弹窗
│   │   │   └── TagManager.tsx       # 标签管理面板
│   │   ├── Auth/                    # 认证组件
│   │   │   └── EditModeModal.tsx    # 编辑模式密码验证弹窗
│   │   ├── EditMode/                # 编辑模式控制
│   │   │   └── EditModeToggle.tsx   # 模式切换按钮
│   │   ├── ChainBuilder/            # 强弱链构建组件
│   │   │   └── ChainToolbar.tsx     # 链图绘制工具栏
│   │   └── Settings/                # 设置组件
│   │       └── FontSizeSlider.tsx   # 字体大小调节
│   ├── hooks/                       # 自定义 Hooks
│   │   ├── useGame.ts               # 核心游戏逻辑
│   │   ├── useGameTimer.ts          # 计时器逻辑
│   │   ├── useCellSelection.ts      # 单元格选择逻辑
│   │   ├── useStickyInput.ts        # 粘滞输入模式
│   │   ├── useSteps.ts              # 步骤记录与撤销
│   │   ├── useHighlights.ts         # 高亮系统
│   │   ├── useSmartNotes.ts          # 智能笔记算法（手动触发）
│   │   ├── useAutoNotes.ts           # 笔记自动更新（操作后自动触发）
│   │   ├── useLocalProgress.ts      # localStorage 进度存取
│   │   ├── useEditMode.ts           # 编辑模式状态
│   │   ├── useChainDrawing.ts       # 强弱链绘制
│   │   └── useKeyboard.ts           # 键盘事件处理
│   ├── lib/                         # 工具库
│   │   ├── db.ts                    # 数据库连接单例
│   │   ├── sudoku/                  # 数独核心算法
│   │   │   ├── types.ts             # 算法层类型定义
│   │   │   ├── board.ts             # 棋盘基础操作
│   │   │   ├── validator.ts         # 合法性校验
│   │   │   ├── candidates.ts        # 候选数计算
│   │   │   ├── techniques/          # 解题技巧
│   │   │   │   ├── index.ts         # 技巧注册与调度
│   │   │   │   ├── nakedSingle.ts   # 唯余法
│   │   │   │   ├── hiddenSingle.ts  # 摒除法（宫/行列）
│   │   │   │   ├── pointingPair.ts  # 区块删减（Pointing）
│   │   │   │   ├── boxLineReduction.ts # 区块删减（Box/Line）
│   │   │   │   ├── nakedSubset.ts   # 显性数组（对/三/四）
│   │   │   │   └── hiddenSubset.ts  # 隐性数组
│   │   │   ├── chains.ts            # 强弱链分析
│   │   │   └── parser.ts            # 题目文本解析（81字符/9行格式）
│   │   └── utils.ts                 # 通用工具函数
│   ├── types/                       # TypeScript 类型定义
│   │   ├── sudoku.ts               # 数独相关类型
│   │   ├── api.ts                   # API 请求/响应类型
│   │   └── game.ts                  # 游戏状态类型
│   └── config/                      # 配置文件
│       └── constants.ts             # 常量定义
├── ecosystem.config.js              # PM2 配置
├── next.config.js                   # Next.js 配置（PWA + 其他）
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 3. 数据库 Schema

使用 SQLite + better-sqlite3。所有表均包含 `id` (GUID/UUID) 和 `_modified` 字段。

### 3.1 建表语句

```sql
-- 题目表
CREATE TABLE IF NOT EXISTS puzzles (
    id          TEXT PRIMARY KEY,          -- UUID v4
    puzzle      TEXT NOT NULL,             -- 题目字符串（81字符, 0或.表示空格）
    solution    TEXT,                      -- 答案字符串（81字符, 可为NULL表示未录入答案）
    difficulty  INTEGER DEFAULT 0,         -- 难度等级 0=未分类 1=简单 2=中等 3=困难 4=专家
    source      TEXT,                      -- 来源说明
    remark      TEXT,                      -- 备注
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    _modified   INTEGER NOT NULL DEFAULT 1 -- 是否被修改（1=是 0=否）
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id          TEXT PRIMARY KEY,          -- UUID v4
    name        TEXT NOT NULL UNIQUE,      -- 标签名称（如"唯余法""X-Wing"等）
    color       TEXT DEFAULT '#1890ff',    -- 标签颜色
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    _modified   INTEGER NOT NULL DEFAULT 1
);

-- 题目-标签关联表（多对多）
CREATE TABLE IF NOT EXISTS puzzle_tags (
    puzzle_id   TEXT NOT NULL,
    tag_id      TEXT NOT NULL,
    PRIMARY KEY (puzzle_id, tag_id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)     REFERENCES tags(id)    ON DELETE CASCADE
);

-- 做题记录表
CREATE TABLE IF NOT EXISTS game_records (
    id              TEXT PRIMARY KEY,          -- UUID v4
    puzzle_id       TEXT NOT NULL,
    time_seconds    INTEGER,                   -- 完成用时（秒）
    completed       INTEGER NOT NULL DEFAULT 0, -- 是否完成 0=未完成 1=已完成
    hint_used       INTEGER DEFAULT 0,         -- 使用提示次数
    check_errors    INTEGER DEFAULT 0,         -- 检查错误次数
    started_at      TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at     TEXT,                      -- 完成时间
    _modified       INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);

-- 设置表（全局配置）
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,           -- 配置键
    value       TEXT NOT NULL,              -- 配置值（JSON）
    _modified   INTEGER NOT NULL DEFAULT 1
);

-- 编辑模式密码
INSERT OR IGNORE INTO settings (key, value) VALUES ('edit_password', 'mysudoku');

-- 索引
CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzles__modified ON puzzles(_modified);
CREATE INDEX IF NOT EXISTS idx_game_records_puzzle ON game_records(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_game_records_completed ON game_records(completed);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
```

### 3.2 数据库初始化逻辑

在 `src/lib/db.ts` 中实现数据库连接单例,首次连接时自动执行建表语句。

---

## 4. API 路由设计

所有 API 路由前缀: `http://localhost:3000/api`

### 4.1 题目 API

#### `GET /api/puzzles`

获取题目列表,支持分页、搜索、标签筛选。

**Query 参数:**

| 参数     | 类型   | 必填 | 说明                       |
| -------- | ------ | ---- | -------------------------- |
| page     | number | 否   | 页码,默认 1                |
| pageSize | number | 否   | 每页数量,默认 20           |
| keyword  | string | 否   | 搜索关键词（题目内容匹配） |
| tagId    | string | 否   | 按标签 ID 筛选             |
| difficulty| number | 否   | 按难度筛选                 |

**响应:**

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "uuid",
        "puzzle": "530070000...",
        "solution": "534678912...",
        "difficulty": 1,
        "source": "某题库",
        "remark": null,
        "tags": [
          { "id": "uuid", "name": "唯余法", "color": "#1890ff" }
        ],
        "created_at": "2025-07-16 12:00:00",
        "updated_at": "2025-07-16 12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### `POST /api/puzzles`

添加单道题目。需要编辑模式。

**请求体:**

```json
{
  "puzzle": "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  "solution": "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  "difficulty": 1,
  "source": "某来源",
  "remark": "备注",
  "tagIds": ["uuid1", "uuid2"]
}
```

#### `GET /api/puzzles/[id]`

获取单个题目详情。

#### `PUT /api/puzzles/[id]`

更新题目信息。需要编辑模式。

#### `DELETE /api/puzzles/[id]`

删除题目。需要编辑模式。

#### `POST /api/puzzles/import`

批量导入题目（剪贴板粘贴）。需要编辑模式。

**请求体:**

```json
{
  "text": "530070000600195000098000060800060003400803001700020006060000280000419005000080079\n006000000100000400000003000000000000...",
  "difficulty": 1,
  "tagIds": ["uuid"]
}
```

支持两种格式自动识别:
- 格式A: 每行81个字符（0或.表示空格）
- 格式B: 每9行为一个题目,其中每行9个字符

#### `POST /api/puzzles/[id]/records`

记录一次做题结果。

**请求体:**

```json
{
  "time_seconds": 360,
  "completed": true,
  "hint_used": 0,
  "check_errors": 2
}
```

### 4.2 标签 API

#### `GET /api/tags`

获取所有标签列表。

#### `POST /api/tags`

添加标签。需要编辑模式。

**请求体:**

```json
{
  "name": "唯余法",
  "color": "#1890ff"
}
```

#### `PUT /api/tags/[id]`

更新标签。需要编辑模式。

#### `DELETE /api/tags/[id]`

删除标签。需要编辑模式。被题目引用的标签需先解除关联。

### 4.3 认证 API

#### `POST /api/auth`

验证编辑模式密码。

**请求体:**

```json
{
  "password": "mysudoku"
}
```

**响应:**

```json
{
  "success": true,
  "message": "已验证"
}
```

### 4.4 通用响应格式

```json
// 成功
{ "success": true, "data": {...} }

// 失败
{ "success": false, "error": "错误描述" }
```

### 4.5 编辑模式验证中间件

API 中涉及增删改操作的路由,需要验证编辑模式密码。实现方式:
- 请求头带 `X-Edit-Password` 字段
- 服务端中间件函数 `verifyEditMode()` 校验
- 密码存在数据库 `settings` 表中,默认 `mysudoku`

---

## 5. 组件树设计

```
<AppLayout>                                    // Ant Design Layout
├── <AppHeader>                                // Ant Design Layout.Header
│   ├── <Typography.Title>                     // 网站标题 "mysudoku"
│   ├── <Menu>                                 // Ant Design Menu（horizontal）
│   │   ├── MenuItem: 游戏
│   │   └── MenuItem: 题目管理（编辑模式下可见）
│   └── <EditModeToggle>                       // 模式切换按钮 + 密码弹窗
│       └── <EditModeModal>                    // Ant Design Modal
│           ├── <Input.Password>               // 密码输入
│           └── <Button>                       // 确认/取消
├── <Content>                                  // Ant Design Layout.Content
│   │
│   ├── [路由: / 或 /game]
│   │   <GamePage>
│   │   ├── <GameToolBar>                      // 工具栏
│   │   │   ├── <ModeTabs>                     // 笔记模式/答题模式切换
│   │   │   │   └── <Segmented>                // Ant Design Segmented
│   │   │   ├── <Button.Group>                 // 操作按钮组
│   │   │   │   ├── <Button> 撤销              // Ant Design Button
│   │   │   │   ├── <Button> 橡皮擦
│   │   │   │   ├── <Button> 智能笔记（手动触发技巧推理）
│   │   │   │   ├── <Button> 错误检查
│   │   │   │   ├── <Button> 显示/隐藏笔记
│   │   │   │   └── <Tag> 笔记状态：智能/普通/过期
│   │   │   ├── <ChainToolbar>                 // 强弱链工具
│   │   │   │   ├── <Button> 添加强链
│   │   │   │   ├── <Button> 添加弱链
│   │   │   │   └── <Button> 清除链图
│   │   │   ├── <FontSizeSlider>               // 字体大小
│   │   │   │   └── <Slider>                   // Ant Design Slider
│   │   │   └── <GameTimer>                    // 计时器
│   │   │       └── <Typography.Text>          // 显示时间
│   │   ├── <SudokuGrid>                       // 棋盘主区域
│   │   │   ├── 9×9 <div> 网格容器
│   │   │   │   └── <Cell> ×81                 // 81个单元格
│   │   │   │       ├── 大数字（答题）
│   │   │   │       └── <NotesLayer>           // 小数字候选数（笔记）
│   │   │   └── <ChainCanvas>                  // <canvas> 覆盖层（绝对定位）
│   │   ├── <NumberPad>                        // 数字输入面板
│   │   │   └── <Button> ×9                    // 数字1-9
│   │   └── <PuzzleSelector>                   // 题目选择器
│   │       └── <Select>                       // Ant Design Select（带搜索）
│   │
│   └── [路由: /puzzles]
│       <PuzzlesPage>
│       ├── <PuzzleTable>                      // 题目列表
│       │   └── <Table>                        // Ant Design Table
│       │       ├── columns: 编号, 题目预览, 难度, 标签, 操作
│       │       ├── <Tag>                      // 难度/标签显示
│       │       └── <Button> 编辑/删除
│       ├── <ImportModal>                      // 导入弹窗
│       │   └── <Modal>
│       │       └── <Input.TextArea>           // 粘贴区域
│       ├── <PuzzleForm>                       // 编辑表单
│       │   └── <Modal> / <Drawer>
│       │       ├── <Form>                     // Ant Design Form
│       │       ├── <Input> 题面
│       │       ├── <Select> 难度
│       │       ├── <Select> 标签（多选）
│       │       └── <Input.TextArea> 备注
│       └── <TagManager>                       // 标签管理
│           ├── <Table>                        // 标签列表
│           └── <Modal>                        // 添加/编辑标签
└── <AppFooter>                                // Ant Design Layout.Footer
```

---

## 6. 数据流设计

### 6.1 客户端状态管理

使用 React Context + useReducer 管理游戏核心状态,不引入额外状态管理库。

#### GameContext 状态结构

```typescript
// src/types/game.ts

/** 单元格数据 */
interface CellData {
  value: number | null;          // 当前值 (1-9, null=空)
  isGiven: boolean;              // 是否为初始数字
  notes: number[];               // 候选数笔记 (1-9)
  isError: boolean;              // 是否有错误
}

/** 解题步骤 */
interface Step {
  type: 'fill' | 'erase' | 'toggleNote' | 'batchFill' | 'batchErase' | 'batchToggleNote';
  changes: StepChange[];         // 本次变更列表
}

interface StepChange {
  row: number;
  col: number;
  prevValue: number | null;      // 变更前的值
  prevNotes: number[];           // 变更前的笔记
  newValue: number | null;       // 变更后的值
  newNotes: number[];            // 变更后的笔记
}

/** 强弱链链接 */
interface ChainLink {
  id: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  type: 'strong' | 'weak';
  candidate: number;             // 关联的候选数
  color: string;
}

/** 游戏状态 */
interface GameState {
  puzzleId: string | null;
  grid: CellData[][];            // 9×9
  selectedCells: [number, number][];  // 选中单元格坐标列表
  inputMode: 'answer' | 'note';  // 答题/笔记模式
  stickyNumber: number | null;   // 粘滞模式数字
  isStickyMode: boolean;         // 是否粘滞模式
  steps: Step[];                 // 步骤历史
  currentStepIndex: number;      // 当前步骤索引（-1 表示无步骤）
  showNotes: boolean;            // 是否显示笔记
  noteType: 'none' | 'normal' | 'smart'; // 当前笔记类型：无/普通/智能
  smartNotesExpired: boolean;    // 智能笔记是否过期（棋盘变更后过期）
  chains: ChainLink[];           // 强弱链数据
  timerRunning: boolean;
  elapsedSeconds: number;
  isCompleted: boolean;
  errorCheckResult: boolean | null; // null=未检查 true=有错 false=无错
}

/** Game Action */
type GameAction =
  | { type: 'LOAD_PUZZLE'; puzzleId: string; puzzle: string; solution?: string }
  | { type: 'SET_CELL_VALUE'; row: number; col: number; value: number | null }
  | { type: 'BATCH_SET_VALUE'; cells: [number, number][]; value: number | null }
  | { type: 'TOGGLE_NOTE'; row: number; col: number; note: number }
  | { type: 'BATCH_TOGGLE_NOTE'; cells: [number, number][]; note: number }
  | { type: 'SELECT_CELL'; row: number; col: number; additive: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_INPUT_MODE'; mode: 'answer' | 'note' }
  | { type: 'SET_STICKY_NUMBER'; number: number | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_SHOW_NOTES'; show: boolean }
  | { type: 'AUTO_NOTES' }
  | { type: 'CHECK_ERRORS' }
  | { type: 'ADD_CHAIN_LINK'; link: ChainLink }
  | { type: 'REMOVE_CHAIN_LINK'; id: string }
  | { type: 'CLEAR_CHAINS' }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'RESTORE_STATE'; state: GameState };
```

### 6.2 localStorage 进度保存

```typescript
// localStorage key
const PROGRESS_KEY = 'mysudoku_game_progress';

interface LocalProgress {
  puzzleId: string;
  grid: Array<Array<{
    value: number | null;
    isGiven: boolean;
    notes: number[];
  }>>;
  steps: Step[];
  currentStepIndex: number;
  showNotes: boolean;
  chains: ChainLink[];
  elapsedSeconds: number;
  timerRunning: boolean;
  savedAt: number;              // Date.now()
}

// 用户设置
const SETTINGS_KEY = 'mysudoku_settings';

interface UserSettings {
  fontSize: number;             // 桌面端单元格字体大小, 默认 24
  autoSaveInterval: number;     // 自动保存间隔(ms), 默认 30000
}
```

**保存策略:**
- 每次操作后自动保存到 localStorage
- 页面加载时自动检测并恢复
- 提供"清除进度"按钮

### 6.3 步骤撤销（Undo）实现

```
步骤记录原理:
  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ Step 1  │ ←→ │ Step 2  │ ←→ │ Step 3  │ ←→ │ Step 4  │
  │ fill    │    │ note    │    │ fill    │    │ erase   │
  └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                              ↑
                                     currentStepIndex = 3

撤销: 根据 currentStepIndex 获取 Step,将其 changes 中的 prevValue/prevNotes 恢复到对应单元格
      currentStepIndex -= 1

重做: currentStepIndex += 1,应用 changes 中的 newValue/newNotes

合并策略:
- 同一单元格连续数字填入合并为一个 step（连续3次点(2,3)填入3 → 一个step）
- 批量操作（多选+填入）合并为一个 step
- 笔记操作独立成 step
```

### 6.4 高亮系统

```typescript
// useHighlights.ts 返回的高亮状态
interface HighlightState {
  rowColHighlight: Set<string>;        // 行列底色突出 (key: "row-col")
  sameNumberHighlight: Set<string>;    // 同数字底色突出 (key: "row-col")
  selectedHighlight: Set<string>;      // 选中单元格边框 (key: "row-col")
  errorHighlight: Set<string>;         // 错误单元格 (key: "row-col")
}
```

**规则:**
1. 选中单元格 → 该单元格所在行、列底色变色（浅蓝）
2. 选中单元格有数字 → 整个棋盘中相同数字的单元格底色变色（浅黄）
3. 被选中的单元格边框/背景色更深
4. 初始数字（isGiven）→ 粗体 + 黑色
5. 错误检查时 → 错误数字所在单元格红色标记

---

## 7. 路由设计

### 7.1 页面路由

| 路径            | 文件                           | 说明                         | 权限       |
| --------------- | ------------------------------ | ---------------------------- | ---------- |
| `/`             | `src/app/page.tsx`             | 首页,重定向到 `/game`        | 公开       |
| `/game`         | `src/app/game/page.tsx`        | 游戏主页面（无指定题目）     | 公开       |
| `/game/[id]`    | `src/app/game/[id]/page.tsx`   | 加载指定题目进入游戏         | 公开       |
| `/puzzles`      | `src/app/puzzles/page.tsx`     | 题目管理页面                 | 编辑模式   |

### 7.2 API 路由

| 方法   | 路径                      | 说明             | 权限       |
| ------ | ------------------------- | ---------------- | ---------- |
| GET    | `/api/puzzles`            | 题目列表         | 公开       |
| POST   | `/api/puzzles`            | 添加题目         | 编辑模式   |
| GET    | `/api/puzzles/[id]`       | 题目详情         | 公开       |
| PUT    | `/api/puzzles/[id]`       | 更新题目         | 编辑模式   |
| DELETE | `/api/puzzles/[id]`       | 删除题目         | 编辑模式   |
| POST   | `/api/puzzles/import`     | 批量导入题目     | 编辑模式   |
| GET    | `/api/tags`               | 标签列表         | 公开       |
| POST   | `/api/tags`               | 添加标签         | 编辑模式   |
| PUT    | `/api/tags/[id]`          | 更新标签         | 编辑模式   |
| DELETE | `/api/tags/[id]`          | 删除标签         | 编辑模式   |
| POST   | `/api/auth`               | 验证编辑密码     | 公开       |

---

## 8. 关键功能实现要点

### 8.1 笔记系统（三层设计）

笔记分为三类，按复杂度递增：

| 类型 | 说明 | 触发方式 |
|------|------|----------|
| **普通笔记** | 简单排除：填入数字后，从同行/列/宫的候选数中移除该数字 | **自动**（填答案/撤销后自动更新） |
| **智能笔记** | 技巧推理：基于唯余、摒除、区块等技巧自动填充候选数 | **手动**（点击「智能笔记」按钮触发） |
| **笔记自动更新** | 填答案/撤销后，自动重新计算受影响单元格的普通笔记 | **自动**（每次操作后触发） |

**三者的关系：**

```
用户操作（填数字/撤销）
    │
    ▼
笔记自动更新 ─── 自动触发 ──→ 更新相关单元格的【普通笔记】
    │
    ▼
用户手动点击「智能笔记」按钮
    │
    ▼
智能笔记 ─── 在普通笔记基础上 ──→ 应用解题技巧进一步筛减候选数
```

**实现原则：**
- 普通笔记 = 基础排除法，永远正确、零误判、性能极快
- 智能笔记 = 普通笔记 + 技巧推理，可能有遗漏（未实现的技巧），按需触发
- 笔记自动更新 = 每次状态变更后自动重新计算受影响区域
- 显示时，如果两种笔记都存在，以智能笔记为准（更精简）
- 当棋盘状态改变后（用户填/删数字），智能笔记标记为「过期」，需重新手动触发

**实现细节：**

#### 笔记自动更新范围

当用户在 `(row, col)` 填入或删除数字时，仅更新以下范围的候选数：
- 同行 (row, 全部列)
- 同列 (全部行, col)
- 同宫（所在 3×3 宫的全部单元格）

此范围之外的单元格候选数不受影响，无需重新计算。

```typescript
// useAutoNotes.ts
function getAffectedCells(row: number, col: number): [number, number][] {
  const cells: [number, number][] = [];
  // 同行
  for (let c = 0; c < 9; c++) cells.push([row, c]);
  // 同列
  for (let r = 0; r < 9; r++) cells.push([r, col]);
  // 同宫
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      cells.push([r, c]);
  return cells;
}
```

#### 智能笔记算法策略

智能笔记采用**分层应用**策略,在普通笔记基础上从简单到复杂依次计算:

```
┌────────────────────────────────────────────────────┐
│                 智能笔记算法流程                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  输入: 当前棋盘状态 (9×9 grid)                       │
│                                                    │
│  Layer 1: 基础候选数计算                             │
│  ├── 遍历所有空格子                                  │
│  └── 排除同行/列/宫内已出现的数字                     │
│                                                    │
│  Layer 2: 唯余法 (Naked Single)                     │
│  ├── 检查每个空格子的候选数                          │
│  └── 若候选数仅1个 → 标记为"可确认"(不自动填,仅提示)  │
│                                                    │
│  Layer 3: 摒除法 (Hidden Single)                    │
│  ├── 对每个宫/行/列                                 │
│  │   └── 若某数字仅能放在唯一位置 → 标记             │
│  └── 更新受影响的空格子候选数                        │
│                                                    │
│  Layer 4: 区块删减 (Pointing Pair/Triple)           │
│  ├── 检查每个宫内的每个数字候选                       │
│  ├── 若某数字候选全部在同一行 → 同行其他宫排除该候选   │
│  └── 若某数字候选全部在同一列 → 同列其他宫排除该候选   │
│                                                    │
│  Layer 5: 行列区块删减 (Box/Line Reduction)          │
│  ├── 检查每行/列中的每个数字候选                       │
│  └── 若某数字候选全部在同一宫 → 同宫内排除该候选       │
│                                                    │
│  Layer 6: 显性数组 (Naked Subset)  [可选,性能考虑]   │
│  ├── Naked Pair/Triple/Quad                        │
│  └── N个格子中恰好包含N个候选 → 排除所在宫的该N个候选  │
│                                                    │
│  输出: 更新所有空格子的候选数集合                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**实现文件:** `src/lib/sudoku/techniques/`

**关键代码逻辑:**

```typescript
// candidates.ts - 基础候选数
function getCandidates(grid: number[][], row: number, col: number): Set<number> {
  const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  // 排除同行
  for (let c = 0; c < 9; c++) candidates.delete(grid[row][c]);
  // 排除同列
  for (let r = 0; r < 9; r++) candidates.delete(grid[r][col]);
  // 排除同宫
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++)
    for (let c = boxCol; c < boxCol + 3; c++)
      candidates.delete(grid[r][c]);
  return candidates;
}

// techniques/index.ts - 技巧调度器
function applySmartNotes(grid: number[][]): number[][][] {
  // 返回 9×9 的候选数数组,每个元素是候选数列表
  let notes = initializeAllNotes(grid);
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    for (const technique of [nakedSingle, hiddenSingle, pointingPair, boxLineReduction]) {
      const result = technique.apply(grid, notes);
      if (result.changed) {
        notes = result.notes;
        changed = true;
      }
    }
    iterations++;
  }
  return notes;
}
```

### 8.2 强弱链图 Canvas 实现思路

**组件:** `src/components/SudokuGrid/ChainCanvas.tsx`

```
┌──────────────────────────────────────────┐
│  SudokuGrid 容器 (position: relative)     │
│  ┌────────────────────────────────────┐  │
│  │ 9×9 Grid (div 布局)                │  │
│  │ ┌───┬───┬───┐                      │  │
│  │ │   │   │   │                      │  │
│  │ ├───┼───┼───┤                      │  │
│  │ │   │   │   │                      │  │
│  │ └───┴───┴───┘                      │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ <canvas> (position: absolute;       │  │
│  │   top:0; left:0; z-index:10;       │  │
│  │   pointer-events:none)             │  │
│  │                                    │  │
│  │   单元格A ●──────────→ ● 单元格B    │  │
│  │            (实线=强链)              │  │
│  │   ● - - - - → ● (虚线=弱链)        │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**绘制算法:**

```typescript
// ChainCanvas.tsx 核心逻辑
function drawChains(ctx: CanvasRenderingContext2D, chains: ChainLink[], cellSize: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  for (const link of chains) {
    const fromCenter = getCellCenter(link.from, cellSize);
    const toCenter = getCellCenter(link.to, cellSize);
    
    // 计算偏移方向（避免线条穿过单元格中心文字）
    const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
    const offset = cellSize * 0.3;
    const startX = fromCenter.x + Math.cos(angle) * offset;
    const startY = fromCenter.y + Math.sin(angle) * offset;
    const endX = toCenter.x - Math.cos(angle) * offset;
    const endY = toCenter.y - Math.sin(angle) * offset;
    
    // 绘制连线
    ctx.beginPath();
    ctx.strokeStyle = link.color;
    ctx.lineWidth = link.type === 'strong' ? 2.5 : 1.5;
    if (link.type === 'weak') ctx.setLineDash([5, 5]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 绘制箭头
    drawArrowhead(ctx, startX, startY, endX, endY, link.color);
    
    // 绘制候选数标签
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(midX - 8, midY - 8, 16, 16);
    ctx.fillStyle = link.color;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(link.candidate), midX, midY + 4);
  }
}
```

**交互流程:**
1. 用户点击工具栏"添加强链"/"添加弱链"
2. 进入链图绘制模式（光标变为十字线）
3. 点击起始单元格 → 点击目标单元格
4. 弹出候选数选择器（或自动使用单元格的候选值）
5. 创建 ChainLink 对象
6. 支持点击已有链的端点进行修改
7. "清除链图"按钮移除所有链

### 8.3 多选/粘滞输入模式实现

#### 多选逻辑 (`useCellSelection.ts`)

```typescript
interface SelectionState {
  selectedCells: [number, number][];
}

function useCellSelection() {
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 点击 → 切换选择
      setSelectedCells(prev => {
        const exists = prev.some(([r, c]) => r === row && c === col);
        if (exists) return prev.filter(([r, c]) => !(r === row && c === col));
        return [...prev, [row, col]];
      });
    } else if (event.shiftKey && selectedCells.length > 0) {
      // Shift + 点击 → 范围选择
      const [firstRow, firstCol] = selectedCells[0];
      const cells: [number, number][] = [];
      const minR = Math.min(firstRow, row), maxR = Math.max(firstRow, row);
      const minC = Math.min(firstCol, col), maxC = Math.max(firstCol, col);
      for (let r = minR; r <= maxR; r++)
        for (let c = minC; c <= maxC; c++)
          cells.push([r, c]);
      setSelectedCells(cells);
    } else {
      // 普通点击 → 单选
      setSelectedCells([[row, col]]);
    }
  };

  return { selectedCells, handleCellClick, setSelectedCells };
}
```

#### 粘滞模式 (`useStickyInput.ts`)

```typescript
function useStickyInput() {
  const [stickyNumber, setStickyNumber] = useState<number | null>(null);
  const [isStickyMode, setIsStickyMode] = useState(false);

  const enterStickyMode = (num: number) => {
    setStickyNumber(num);
    setIsStickyMode(true);
  };

  const exitStickyMode = () => {
    setStickyNumber(null);
    setIsStickyMode(false);
  };

  const handleNumberClick = (num: number) => {
    if (isStickyMode && stickyNumber === num) {
      exitStickyMode();  // 再次点击相同数字退出
    }
    // ...如果之前不在粘滞模式，普通单击处理
  };

  const handleNumberDoubleClick = (num: number) => {
    if (!isStickyMode) {
      enterStickyMode(num);  // 双击进入粘滞模式
    }
  };

  return { stickyNumber, isStickyMode, enterStickyMode, exitStickyMode,
           handleNumberClick, handleNumberDoubleClick };
}
```

### 8.4 步骤撤销实现

**原理:**
- 每次操作记录完整的 `Step`（包含操作前后状态）
- 撤销时恢复操作前的状态
- 使用 `currentStepIndex` 指针跟踪当前位置
- 新的操作会丢弃指针之后的所有步骤（类似浏览器前进/后退）

**实现 (`useSteps.ts`):**

```typescript
function useSteps(dispatch: React.Dispatch<GameAction>) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushStep = (step: Step) => {
    // 丢弃 currentIndex 之后的步骤
    const newSteps = steps.slice(0, currentIndex + 1);
    newSteps.push(step);
    setSteps(newSteps);
    setCurrentIndex(newSteps.length - 1);
  };

  const undo = () => {
    if (currentIndex < 0) return;
    const step = steps[currentIndex];
    // 恢复 prevValue/prevNotes
    for (const change of step.changes) {
      dispatch({ type: 'SET_CELL_VALUE', row: change.row, col: change.col, value: change.prevValue });
      // ...恢复笔记
    }
    setCurrentIndex(currentIndex - 1);
  };

  const redo = () => {
    if (currentIndex >= steps.length - 1) return;
    const step = steps[currentIndex + 1];
    for (const change of step.changes) {
      dispatch({ type: 'SET_CELL_VALUE', row: change.row, col: change.col, value: change.newValue });
      // ...应用新笔记
    }
    setCurrentIndex(currentIndex + 1);
  };

  return { pushStep, undo, redo, canUndo: currentIndex >= 0, canRedo: currentIndex < steps.length - 1 };
}
```

### 8.5 高亮系统

**CSS 类名方案:**

```css
/* globals.css */

/* 选中单元格的行/列底色 */
.cell.row-highlight, .cell.col-highlight {
  background-color: #e6f4ff;  /* 浅蓝 */
}

/* 同数字高亮 */
.cell.same-number {
  background-color: #fff7e6;  /* 浅黄 */
}

/* 当前选中的单元格 */
.cell.selected {
  background-color: #bae0ff;  /* 中等蓝 */
  box-shadow: 0 0 0 2px #1677ff inset;
}

/* 初始数字 */
.cell.given .cell-value {
  font-weight: 700;
  color: #000000;
}

/* 用户填入数字 */
.cell.user-filled .cell-value {
  font-weight: 400;
  color: #1677ff;
}

/* 错误单元格 */
.cell.error .cell-value {
  color: #ff4d4f;
}

/* 粘滞模式下悬浮提示 */
.cell.sticky-hover:hover {
  background-color: #f0f0f0;
  cursor: copy;
}
```

**计算逻辑 (`useHighlights.ts`):**

```typescript
function useHighlights(selectedCells: [number, number][], grid: CellData[][], errorCheckResult: boolean | null) {
  const rowColSet = useMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of selectedCells) {
      for (let i = 0; i < 9; i++) { set.add(`${r}-${i}`); set.add(`${i}-${c}`); }
    }
    return set;
  }, [selectedCells]);

  const sameNumberSet = useMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of selectedCells) {
      const val = grid[r][c].value;
      if (!val) continue;
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (grid[i][j].value === val) set.add(`${i}-${j}`);
    }
    return set;
  }, [selectedCells, grid]);

  return { rowColSet, sameNumberSet };
}
```

### 8.6 PWA 离线策略

使用 `@ducanh2912/next-pwa` 实现。

**next.config.js 配置:**

```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

module.exports = withPWA({
  // 其他 Next.js 配置...
});
```

**public/manifest.json:**

```json
{
  "name": "mysudoku",
  "short_name": "mysudoku",
  "description": "个人学习和练习数独",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1677ff",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**离线策略:**
- **静态资源:** Cache-First（缓存优先,版本更新时刷新）
- **API 请求:** Network-First（网络优先,失败时回退到缓存）
- **游戏数据:** localStorage 本地存储,在线时可选同步
- **题目数据:** API 请求结果缓存,离线时使用缓存
- **做题记录:** 离线存储,联网时批量上传

**离线优先级:**
1. 游戏核心功能完全离线可用（棋盘交互、笔记、撤销、计时）
2. 智能笔记算法纯前端运算,无需网络
3. 题目列表和详情缓存后可离线浏览
4. 编辑操作（增删改题目）仅在线+编辑模式下可用

### 8.7 浏览/编辑模式实现

```typescript
// src/hooks/useEditMode.ts
function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      message.info('已退出编辑模式');
    } else {
      setShowPasswordModal(true);
    }
  };

  const verifyPassword = async (password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      setIsEditMode(true);
      setShowPasswordModal(false);
      // 存储密码用于后续 API 请求
      sessionStorage.setItem('edit_password', password);
      message.success('已进入编辑模式');
    } else {
      message.error('密码错误');
    }
  };

  return { isEditMode, showPasswordModal, setShowPasswordModal, toggleEditMode, verifyPassword };
}
```

**API 请求自动附带密码:**

```typescript
// 封装 fetch,自动附加编辑密码到请求头
async function apiFetch(url: string, options?: RequestInit) {
  const password = sessionStorage.getItem('edit_password');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (password) headers['X-Edit-Password'] = password;
  return fetch(url, { ...options, headers });
}
```

**UI 表现:**
- 编辑模式: 导航栏显示"题目管理"入口,所有增删改按钮可见
- 浏览模式: 导航栏无"题目管理"入口,所有增删改按钮隐藏
- 通过 URL 直接访问 `/puzzles` 时,若未在编辑模式则重定向到 `/`

### 8.8 题目解析

```typescript
// src/lib/sudoku/parser.ts

/**
 * 解析剪贴板文本中的题目
 * 支持两种格式:
 *   A: 每行81字符（0或.表示空格）
 *   B: 每9行为一个题目（每行9字符,0或.表示空格）
 */
function parsePuzzleText(text: string): string[] {
  const cleanLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const puzzles: string[] = [];
  
  for (const line of cleanLines) {
    if (line.length === 81 && /^[0-9.]+$/.test(line)) {
      // 格式A: 81字符一行
      puzzles.push(line.replace(/\./g, '0'));
    }
  }
  
  if (puzzles.length === 0) {
    // 尝试格式B: 每9行一个题目
    for (let i = 0; i < cleanLines.length; i += 9) {
      const chunk = cleanLines.slice(i, i + 9);
      if (chunk.length === 9 && chunk.every(l => l.length === 9 && /^[0-9.]+$/.test(l))) {
        puzzles.push(chunk.join('').replace(/\./g, '0'));
      }
    }
  }
  
  return puzzles;
}

/**
 * 校验题目是否合法（是否有唯一解）
 */
function validatePuzzle(puzzle: string): { valid: boolean; solution?: string } {
  // 实现求解器验证
  // ...
}
```

### 8.9 键盘事件处理

```typescript
// src/hooks/useKeyboard.ts
function useKeyboard(dispatch: React.Dispatch<GameAction>, selectedCells: [number, number][]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框内的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // 数字键 1-9
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        // 根据输入模式处理...
      }
      
      // 删除/退格 → 擦除
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // 擦除选中的单元格
      }
      
      // Ctrl+Z → 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      
      // Escape → 退出粘滞模式/清除选择
      if (e.key === 'Escape') {
        // ...
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, selectedCells]);
}
```

---

## 9. 部署配置

### 9.1 ecosystem.config.js (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/mysudoku/logs/error.log',
      out_file: '/opt/mysudoku/logs/out.log',
      merge_logs: true,
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
```

### 9.2 部署流程

```bash
# 1. SSH 连接服务器
ssh tencent

# 2. 克隆仓库
cd /opt
git clone https://github.com/loho1968/mysudoku.git
cd mysudoku

# 3. 创建必要目录
mkdir -p data logs .ai

# 4. 安装依赖
npm install

# 5. 构建项目
npm run build

# 6. 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启

# 7. 后续更新
git pull
npm install --production
npm run build
pm2 restart mysudoku
```

### 9.3 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 10. 开发环境配置

### 10.1 本地开发

```bash
# 克隆仓库
git clone https://github.com/loho1968/mysudoku.git
cd mysudoku

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 10.2 SSH 远程开发

```bash
# VS Code Remote-SSH 连接
ssh tencent
cd /opt/mysudoku

# 开发模式启动
npm run dev -- -p 3000
# 或通过 PM2 启动开发模式
pm2 start "npm run dev" --name mysudoku-dev
```

### 10.3 codegraph 集成

```bash
# 首次初始化
cd /opt/mysudoku
npx codegraph init

# 每次代码修改后同步
npx codegraph sync

# codegraph 配置（.codegraph/config.json）
{
  "projectRoot": "/opt/mysudoku",
  "sourceDir": "src",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "data"],
  "indexInterval": "onSave"
}
```

### 10.4 ant-design-cli MCP 集成

```bash
# 安装配置 ant-design-cli MCP
npm install -D @ant-design/cli

# 在 MCP 配置中添加:
# {
#   "mcpServers": {
#     "ant-design-cli": {
#       "command": "npx",
#       "args": ["-y", "@ant-design/cli", "mcp"]
#     }
#   }
# }
```

### 10.5 推荐 VS Code 插件

| 插件                   | 用途               |
| ---------------------- | ------------------ |
| ESLint                 | 代码规范检查       |
| Prettier               | 代码格式化         |
| Remote-SSH             | 远程开发           |
| SQLite Viewer          | 数据库浏览         |
| Thunder Client         | API 测试           |

### 10.6 package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "s:init": "npx codegraph init",
    "s:sync": "npx codegraph sync"
  }
}
```

---

## 11. 附录

### 11.1 .gitignore

```gitignore
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# data
data/mysudoku.db

# logs
logs/

# IDE
.vscode/settings.json
.idea/
```

### 11.2 类型定义汇总

```typescript
// src/types/sudoku.ts
export interface Puzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  source: string | null;
  remark: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface GameRecord {
  id: string;
  puzzle_id: string;
  time_seconds: number | null;
  completed: boolean;
  hint_used: number;
  check_errors: number;
  started_at: string;
  finished_at: string | null;
}

// src/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// src/types/game.ts
export type CellValue = number | null;
export type Grid = CellValue[][];

export interface CellData {
  value: number | null;
  isGiven: boolean;
  notes: number[];
  isError: boolean;
}

export type InputMode = 'answer' | 'note';
```

### 11.3 常量定义

```typescript
// src/config/constants.ts
export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const DEFAULT_FONT_SIZE = 24;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 40;

export const AUTO_SAVE_INTERVAL = 30000;         // 30s
export const DEFAULT_EDIT_PASSWORD = 'mysudoku';
export const PROGRESS_KEY = 'mysudoku_game_progress';
export const SETTINGS_KEY = 'mysudoku_settings';

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: '未分类',
  1: '简单',
  2: '中等',
  3: '困难',
  4: '专家',
};

export const CHAIN_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#f5222d', '#faad14',
];
```

### 11.4 开发阶段划分

| 阶段 | 内容                                     | 预估工时 |
| ---- | ---------------------------------------- | -------- |
| 一   | 项目脚手架 + 数据库 + 基础 API           | 2天      |
| 二   | 棋盘组件 + 基础交互（输入/选择/高亮）    | 3天      |
| 三   | 笔记系统 + 智能笔记算法                  | 2天      |
| 四   | 步骤撤销 + 计时器                        | 1天      |
| 五   | 强弱链图 Canvas 实现                     | 2天      |
| 六   | 题目管理（CRUD + 导入 + 标签）           | 2天      |
| 七   | 编辑模式 + 浏览模式                      | 1天      |
| 八   | PWA + localStorage 进度 + 离线支持       | 1天      |
| 九   | 响应式适配 + 字体设置 + 移动端优化       | 1天      |
| 十   | 部署 + 测试 + 文档                       | 1天      |
| **合计** |                                        | **16天** |

### 11.5 未纳入阶段一的功能（预留）

- 文件批量上传题目
- 图片 OCR 识别题目
- 自动求解器（一键求解）
- 提示系统（给出下一步）
- 用户系统/多用户支持
- 做题统计分析
- 题目分享/导入导出
- 音效
- 深色模式
- 国际化
- 难度自动评定
- 多种数独变体（对角线、杀手数独等）

---

> 本文档为 mysudoku 项目的权威需求和技术设计文档。  
> 开发过程中如有变更需同步更新本文件和 `.ai/DECISIONS.md`。
