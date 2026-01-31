#!/bin/bash
cd "$(dirname "$0")"

# 解析参数
IS_DAEMON=false
IS_PLUS=false

for arg in "$@"; do
    case "$arg" in
        -d|--daemon)
            IS_DAEMON=true
            ;;
        -p|--plus)
            IS_PLUS=true
            ;;
    esac
done

# 设置二进制文件名
if [ "$IS_PLUS" = true ]; then
    BINARY_NAME="cli-proxy-api-plus"
else
    BINARY_NAME="cli-proxy-api"
fi

# 从 config.yaml 读取端口号
PORT=$(grep "^port:" ./config.yaml | awk '{print $2}')
if [ -z "$PORT" ]; then
    PORT=8317  # 默认端口
fi

echo "检测端口 $PORT 是否被占用..."

# 检查端口是否被占用
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "端口 $PORT 已被进程 $PID 占用,正在优雅关闭..."
    kill -15 $PID 2>/dev/null

    # 等待最多 5 秒让进程优雅退出
    for i in {1..10}; do
        sleep 0.5
        if ! ps -p $PID > /dev/null 2>&1; then
            echo "进程已优雅关闭"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "进程未响应,强制终止..."
            kill -9 $PID 2>/dev/null
            sleep 1
            echo "进程已强制终止"
        fi
    done
else
    echo "端口 $PORT 未被占用"
fi

# 尝试从 .github_token 文件获取 GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f .github_token ]; then
        export GITHUB_TOKEN=$(cat .github_token | tr -d '\n')
    fi
fi

# 构建传给 update.js 的参数（将 -p 转换为 --plus）
UPDATE_ARGS=()
for arg in "$@"; do
    case "$arg" in
        -p) UPDATE_ARGS+=("--plus") ;;
        *) UPDATE_ARGS+=("$arg") ;;
    esac
done

# 执行更新检查
node ./update.js "${UPDATE_ARGS[@]}"

# 根据模式启动
if [ "$IS_DAEMON" = true ]; then
    echo "正在后台启动 $BINARY_NAME..."
    "./$BINARY_NAME" --config ./config.yaml > /dev/null 2>&1 &
    echo "已在后台启动"
    echo "停止命令: pkill -f '$BINARY_NAME' 或 lsof -ti:$PORT | xargs kill -9"
else
    echo "正在启动 $BINARY_NAME..."
    "./$BINARY_NAME" --config ./config.yaml
fi
