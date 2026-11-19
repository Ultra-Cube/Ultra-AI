REM  [UCUBETECH-COPYRIGHT]
REM  Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
REM  Developed by Ultra Zone Team — ultra-zone.ucubetech.com
REM  GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

@echo off
title Skales WhatsApp Bot
echo.
echo  ============================================
echo   Skales WhatsApp Bot
echo  ============================================
echo.

cd /d "%~dp0"

:: Check for required packages
node -e "require('whatsapp-web.js')" 2>nul
if %errorlevel% neq 0 (
    echo [!] Installing required packages...
    call npm install whatsapp-web.js qrcode
    echo.
)

echo [*] Starting WhatsApp Bot...
echo [*] Open Settings > Integrations > WhatsApp to scan QR code
echo [*] Press Ctrl+C to stop
echo.

node whatsapp-bot.js
pause
