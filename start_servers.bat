@echo off
title Starting NE-ROUTE Servers in Background...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_background_servers.ps1"
echo.
pause
