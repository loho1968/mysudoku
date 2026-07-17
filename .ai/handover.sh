#!/usr/bin/env bash
# MySudoku 交班脚本（本机开发 + 一键发布，Roamly 模式）
# 先 git 提交并推送到 GitHub，再发布到服务器。
# 用法: bash .ai/handover.sh ["自定义提交说明"]
set -uo pipefail

cd "$(dirname "$0")/.."
MSG="${1:-chore: 交班自动提交 $(date '+%Y-%m-%d %H:%M')}"

echo "[handover] ===== git 提交并推送到 GitHub ====="
git add -A
if git diff --cached --quiet; then
  echo "[handover] 无改动需要提交"
else
  git commit -m "$MSG"
fi
git push -u origin master

echo "[handover] ===== 发布到服务器 ====="
bash .ai/deploy.sh

echo "[handover] 完成"
