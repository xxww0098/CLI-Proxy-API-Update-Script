@echo off
cd /d "%~dp0"

set "GITHUB_TOKEN="
if exist .github_token (
    set /p GITHUB_TOKEN=<.github_token
)

taskkill /F /IM cli-proxy-api.exe 2>nul
timeout /t 1 /nobreak >nul

node update.js >nul 2>&1
start /B cli-proxy-api --config config.yaml >nul 2>&1
echo 已启动
echo 停止命令: taskkill /F /IM cli-proxy-api.exe
