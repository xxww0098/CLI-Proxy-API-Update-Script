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

node ./update.js "$@"
./$BINARY_NAME --config ./config.yaml
