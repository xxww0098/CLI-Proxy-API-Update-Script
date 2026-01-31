#!/bin/bash
cd "$(dirname "$0")"

# 从 config.yaml 读取端口号
PORT=$(grep "^port:" ./config.yaml | awk '{print $2}')
if [ -z "$PORT" ]; then
    PORT=8317  # 默认端口
fi

echo "检测端口 $PORT 是否被占用..."

# 检查端口是否被占用
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "端口 $PORT 已被进程 $PID 占用,正在终止..."
    kill -9 $PID
    sleep 1
    echo "进程已终止"
else
    echo "端口 $PORT 未被占用"
fi

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

echo "正在后台启动 $BINARY_NAME..."
node ./update.js "$@"
./$BINARY_NAME --config ./config.yaml > /dev/null 2>&1 &
echo "已在后台启动"
echo "停止命令: pkill -f '$BINARY_NAME' 或 lsof -ti:$PORT | xargs kill -9"
