@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "IS_DAEMON=false"
set "IS_PLUS=false"
set "BINARY_NAME=cli-proxy-api.exe"

for %%a in (%*) do (
    if "%%a"=="-d" set "IS_DAEMON=true"
    if "%%a"=="--daemon" set "IS_DAEMON=true"
    if "%%a"=="-p" (
        set "BINARY_NAME=cli-proxy-api-plus.exe"
        set "IS_PLUS=true"
    )
    if "%%a"=="--plus" (
        set "BINARY_NAME=cli-proxy-api-plus.exe"
        set "IS_PLUS=true"
    )
)

set "GITHUB_TOKEN="
if exist .github_token (
    set /p GITHUB_TOKEN=<.github_token
)

:: 构建传给 update.js 的参数（将 -p 转换为 --plus）
set "UPDATE_ARGS="
for %%a in (%*) do (
    if "%%a"=="-p" (
        set "UPDATE_ARGS=!UPDATE_ARGS! --plus"
    ) else (
        set "UPDATE_ARGS=!UPDATE_ARGS! %%a"
    )
)

node update.js %UPDATE_ARGS%

if "%IS_DAEMON%"=="true" (
    echo 正在后台启动 %BINARY_NAME%...
    start /MIN "CLIProxyApi" %BINARY_NAME% --config config.yaml
    echo 已在后台启动
    echo 停止命令: taskkill /F /IM %BINARY_NAME%
) else (
    %BINARY_NAME% --config config.yaml
)
