#!/bin/bash
cd "$(dirname "$0")"

# 尝试从多个来源获取 GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f .github_token ]; then
        export GITHUB_TOKEN=$(cat .github_token | tr -d '\n')
    fi
fi

pkill -f "cli-proxy-api" 2>/dev/null || true
node ./update.js 2>/dev/null
./cli-proxy-api --config ./config.yaml > /dev/null 2>&1 &
echo "已在后台启动"
echo "停止命令: pkill -f 'cli-proxy-api'"
