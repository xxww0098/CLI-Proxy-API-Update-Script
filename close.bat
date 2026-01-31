@echo off
cd /d "%~dp0"

set "STOPPED=0"

rem 停止普通版本
tasklist | findstr /I "cli-proxy-api.exe" >nul
if %errorlevel% equ 0 (
    taskkill /F /IM cli-proxy-api.exe >nul 2>&1
    echo [OK] cli-proxy-api 已停止
    set "STOPPED=1"
)

rem 停止 Plus 版本
tasklist | findstr /I "cli-proxy-api-plus.exe" >nul
if %errorlevel% equ 0 (
    taskkill /F /IM cli-proxy-api-plus.exe >nul 2>&1
    echo [OK] cli-proxy-api-plus 已停止
    set "STOPPED=1"
)

rem 如果没有停止任何服务
if "%STOPPED%"=="0" (
    echo [INFO] 没有运行中的服务
)
