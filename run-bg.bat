@echo off
cd /d "%~dp0"

set "GITHUB_TOKEN="
if exist .github_token (
    set /p GITHUB_TOKEN=<.github_token
)

set "BINARY_NAME=cli-proxy-api"
set "IS_PLUS=false"

for %%a in (%*) do (
    if "%%a"=="--plus" (
        set "BINARY_NAME=cli-proxy-api-plus"
        set "IS_PLUS=true"
    )
)

taskkill /F /IM %BINARY_NAME%.exe 2>nul
timeout /t 1 /nobreak >nul

node update.js %* >nul 2>&1
start /B %BINARY_NAME% --config config.yaml >nul 2>&1
echo 已启动
echo 停止命令: taskkill /F /IM %BINARY_NAME%.exe
