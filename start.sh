#!/bin/bash
cd "$(dirname "$0")"

# 检查是否是 plus 版本
IS_PLUS=false
BINARY_NAME="cli-proxy-api"
for arg in "$@"; do
    if [ "$arg" = "--plus" ]; then
        IS_PLUS=true
        BINARY_NAME="cli-proxy-api-plus"
        break
    fi
done

# 尝试从多个来源获取 GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f .github_token ]; then
        export GITHUB_TOKEN=$(cat .github_token | tr -d '\n')
    fi
fi

pkill -f "$BINARY_NAME" 2>/dev/null || true
node ./update.js "$@"
./$BINARY_NAME --config ./config.yaml > /dev/null 2>&1 &
echo "已在后台启动"
echo "停止命令: pkill -f '$BINARY_NAME'"
