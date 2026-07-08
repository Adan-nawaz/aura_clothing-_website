@echo off
title AURA Website Server
color 0A
echo.
echo  ====================================
echo        AURA CLOTHING WEBSITE
echo  ====================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is NOT installed on this computer!
    echo.
    echo To run this website, you must install Node.js first.
    echo Opening the Node.js download page for you...
    echo.
    start https://nodejs.org/
    echo Please download and install the LTS version of Node.js.
    echo Once installed, restart your computer and run this file again.
    echo.
    pause
    exit /b
)

echo  Starting your website server...
echo.
cd /d "%~dp0"
node server.js
pause
