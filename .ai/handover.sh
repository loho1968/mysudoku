#!/usr/bin/env bash
# MySudoku 交班脚本：先发布（构建+重启），再 git 提交并推送
# 用法: bash .ai/handover.sh ["自定义提交说明"]
# 约定：即使发布步骤异常，也必须完成 git 提交与推送
set -uo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /opt/mysudoku

echo "[handover] ===== 第一步：发布 ====="
# 发布失败也不跳过提交（交班必须完成 git 提交推送）
bash .ai/deploy.sh || echo "[handover] 发布步骤异常，仍继续提交"

echo "[handover] ===== 第二步：git 提交并推送 ====="
git add -A
MSG="${1:-chore: 交班自动提交 $(date '+%Y-%m-%d %H:%M')}"
if git diff --cached --quiet; then
  echo "[handover] 无改动需要提交"
else
  git commit -m "$MSG"
fi

echo "[handover] 推送到 origin/master ..."
git push -u origin master

echo "[handover] 完成"
