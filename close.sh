#!/bin/bash
cd "$(dirname "$0")"

# 停止所有版本的服务
STOPPED=false

# 停止普通版本
if pgrep -f "cli-proxy-api" > /dev/null 2>&1; then
    pkill -f "cli-proxy-api"
    echo "✅ cli-proxy-api 已停止"
    STOPPED=true
fi

# 停止 Plus 版本
if pgrep -f "cli-proxy-api-plus" > /dev/null 2>&1; then
    pkill -f "cli-proxy-api-plus"
    echo "✅ cli-proxy-api-plus 已停止"
    STOPPED=true
fi

# 如果没有停止任何服务
if [ "$STOPPED" = false ]; then
    echo "ℹ️  没有运行中的服务"
fi
