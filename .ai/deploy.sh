#!/usr/bin/env bash
# MySudoku 发布脚本：构建生产包 + 通过 pm2 重启服务
# 用法: bash .ai/deploy.sh
set -euo pipefail

# 服务器 node 装在 nvm 下，非登录 shell 默认不加载 PATH，这里显式加载
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /opt/mysudoku

echo "[deploy] node=$(node -v) npm=$(npm -v) pwd=$(pwd)"

# 依赖已随仓库存在；仅当 package-lock.json 比 node_modules 新时才增量安装
if [ package-lock.json -nt node_modules ] 2>/dev/null; then
  echo "[deploy] 检测到依赖变化，执行 npm install ..."
  npm install
else
  echo "[deploy] 依赖无变化，跳过安装"
fi

echo "[deploy] 构建生产包 (next build --webpack) ..."
npm run build

echo "[deploy] 重启服务 (pm2) ..."
if pm2 describe mysudoku >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo "[deploy] 完成"
pm2 status mysudoku
