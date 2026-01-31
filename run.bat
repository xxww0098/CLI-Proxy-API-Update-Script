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

node update.js %*
%BINARY_NAME% --config config.yaml
