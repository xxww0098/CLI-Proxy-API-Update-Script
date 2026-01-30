@echo off
cd /d "%~dp0"

set "GITHUB_TOKEN="
if exist .github_token (
    set /p GITHUB_TOKEN=<.github_token
)

node update.js
cli-proxy-api --config config.yaml
