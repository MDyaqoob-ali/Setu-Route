@echo off
title Stopping NE-ROUTE Background Servers...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop_background_servers.ps1"
echo.
pause
