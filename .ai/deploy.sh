#!/usr/bin/env bash
# MySudoku 发布脚本（本机开发 + 一键发布，Roamly 模式）
# 构建在本机完成（内存充裕，不 OOM），只把产物 rsync 到服务器跑 next start。
# 用法: bash .ai/deploy.sh
set -euo pipefail

# 使用与服务器一致的 node 版本构建
export PATH="/Users/lh/.nvm/versions/node/v24.18.0/bin:$PATH"

# 切到项目根目录（无论从哪调用）
cd "$(dirname "$0")/.."
echo "[deploy] 项目根: $(pwd)  node=$(node -v)"

echo "[deploy] 本机构建 (next build --webpack) ..."
npm run build

echo "[deploy] 同步产物到 tencent:/opt/mysudoku ..."
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude data \
  --exclude logs \
  --exclude .codegraph \
  --exclude .workbuddy \
  --exclude '.next/cache' \
  ./ tencent:/opt/mysudoku/

echo "[deploy] 服务器同步依赖并重启 pm2 ..."
ssh tencent 'cd /opt/mysudoku && npm install && pm2 reload ecosystem.config.js --update-env 2>/dev/null || pm2 restart mysudoku; pm2 save'

echo "[deploy] 完成"
