REM  ╔══════════════════════════════════════════════════════════════════════════╗
REM  ║                                                                          ║
REM  ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
REM  ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
REM  ║ ██║   ██║██║     ███████║██████╔╝                                        ║
REM  ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
REM  ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
REM  ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
REM  ║                                                                          ║
REM  ║ Project   : Ultra AI — Proprietary AI Platform                           ║
REM  ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
REM  ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
REM  ║ GitHub    : github.com/Ultra-Cube                                        ║
REM  ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
REM  ║ [UCUBETECH-COPYRIGHT]                                                    ║
REM  ║                                                                          ║
REM  ╚══════════════════════════════════════════════════════════════════════════╝

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
