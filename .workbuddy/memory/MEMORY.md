# MySudoku 项目记忆

## 项目规则（loho 明确约定）

- **代码搜索优先用 CodeGraph**：不要用 grep/find 手动翻，直接 `codegraph query` / `codegraph explore` / `codegraph impact` 等。
  - 远程服务器 `/opt/mysudoku` 已带 `.codegraph/`，`package.json` 配了脚本：`npm run s:init`（初始化索引）、`npm run s:sync`（增量同步）。
- **每次修改代码后执行 `codegraph sync`**：保持索引与代码同步，确保后续搜索结果准确。

## 目录约定（2026-07-17 决策）

- **服务器项目家目录 = `/opt`**：远程 tencent 服务器上，`/opt` 放的是带 `.git`+`node_modules` 的服务器实时开发目录（已存在 `mycube`、`roamly`、`harmony-and-mac`、`mysudoku`）。`/opt` 不是纯"发布产物"目录。
- **MySudoku 保持在 `/opt/mysudoku`，不迁移到 `/developer`**：与 mycube/roamly 等保持一致，且避免改 `ecosystem.config.js` 中 `/opt/mysudoku` 的 4 处硬编码路径（`cwd`/`DATABASE_PATH`/`error_file`/`out_file`）。
- 若未来想做"开发/发布分离"规范，应统一规整所有项目，而非单独挪 MySudoku。

## 开发模型（2026-07-17 切换为 Roamly 模式：本机开发 + 一键发布）

- **本机是开发副本**：`/Users/lh/Developer/MySudoku`（git，origin=GitHub `https://github.com/loho1968/mysudoku.git`，本机用 osxkeychain 中 loho1968 凭据推送；SSH key 未被 GitHub 授权故不用 SSH）。
  - 已于 2026-07-17 11:1x 从 `/Users/lh/WorkBuddy/MySudoku` 迁移到 `/Users/lh/Developer/MySudoku`（连同 `.workbuddy` 记忆目录一起搬）。脚本用 `cd "$(dirname "$0")/.."` 定位项目根，移动后无需改脚本。
- **服务器 `/opt/mysudoku` 仅是运行/部署目标**，不再是开发目录（避免 3.7GB 内存 `next build` OOM）。
- **发布（`.ai/deploy.sh`，本机运行）**：本机 `npm run build`（用 node 24.18.0，PATH 指向 `/Users/lh/.nvm/versions/node/v24.18.0/bin`）→ `rsync -az --delete` 到 `tencent:/opt/mysudoku`，排除 `node_modules/.git/data/logs/.codegraph/.workbuddy/.next/cache` → ssh 执行 `npm install` + `pm2 reload ecosystem.config.js`。
- **交班（`.ai/handover.sh`，本机运行）**：`git add -A` + commit + `git push -u origin master` → 调 `deploy.sh` 发布。
- **服务器 `.ai/deploy.sh` 已改为「仅重启」**（npm install + pm2 reload），不再跑 `next build`，杜绝 OOM 陷阱。
- **node 版本**：本机与服务器均用 **node 24.18.0**。本机 `/Users/lh/.nvm/versions/node/v24.18.0`；服务器 `/root/.nvm/versions/node/v24.18.0`（且 node/npm/npx/pm2 已软链到 `/usr/local/bin`，任意 shell 可直接用 pm2，无需 source nvm）。

## 项目概况（/opt/mysudoku，远程 tencent 服务器）

- **类型**：Next.js 16 数独应用（PWA），`create-next-app` 脚手架初始化。
- **技术栈**：Next.js 16.2.10 + React 19 + Ant Design 6 + better-sqlite3 + `@ducanh2912/next-pwa`。
- **端口**：生产/ dev 均跑 `3003`；数据库 SQLite 路径 `/opt/mysudoku/data/mysudoku.db`。
- **部署**：`ecosystem.config.js` 配 pm2 参数（name=mysudoku，端口 3003，DB=`data/mysudoku.db`），已通过 `.ai/deploy.sh` 部署并在 pm2 运行（详见下方"部署与运维"）。
- **连接**：`ssh tencent` 连远程，项目目录 `/opt/mysudoku`。
- **AGENTS.md 提醒**：此 Next.js 16 与训练数据有 breaking changes，写代码前先读 `node_modules/next/dist/docs/`。

## 部署与运维（远程 /opt/mysudoku）

- **运行方式**：pm2 管理，`ecosystem.config.js`（name=mysudoku，端口 3003，SQLite=`data/mysudoku.db`）。当前已在 pm2 运行（id 54），`/`→307→`/game`(200)，`/puzzles`、`/api/puzzles`、`/api/tags` 均 200，better-sqlite3 正常。
- **PATH（已解决）**：node/pm2 原装在 nvm（`/root/.nvm/versions/node/v24.18.0`）下，非登录 shell 默认无 PATH。已把 `node/npm/npx/pm2` 软链到 `/usr/local/bin`（默认 PATH 内），现在任意 shell 直接可用 pm2/node，无需 source nvm。脚本里的 nvm source 行保留为兼容，无害。
- **swap**：服务器仅 3.7GB 内存且无 swap，`next build` 曾 OOM 被杀（exit 137）。已加 4GB `/swapfile` 并写入 `/etc/fstab` 持久化，构建才稳定通过。
- **`.ai/deploy.sh`（命令"发布"，本机运行）**：见上方"开发模型"。本机构建 + rsync + 服务器 `npm install` + `pm2 reload`。**不再在服务器跑 `next build`**。
- **`.ai/handover.sh`（命令"交班"，本机运行）**：先 `git commit` + `git push -u origin master`（推送 GitHub），再调 deploy.sh 发布。约定：交班必须完成 git 提交与推送。
- **git**：origin=`https://github.com/loho1968/mysudoku.git`，分支 master，首次 push 需 `-u origin master`。
- 可选：`pm2 startup` 配置开机自启（尚未做）。
- 已知风险：npm 11 的 `allow-scripts` 会拦截 better-sqlite3/sharp 的 install 脚本。当前原生模块已就绪可用；若将来 `npm install` 后 DB 报 native 加载错误，执行 `npm rebuild better-sqlite3` 或 `npm approve-scripts`。
