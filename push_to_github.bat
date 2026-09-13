@echo off
title Push Setu-Route to GitHub
cd /d "%~dp0"
echo =======================================================
echo Pushing NE-ROUTE (Setu-Route) to GitHub...
echo.
echo If a GitHub sign-in popup appears, select:
echo    "Sign in with your browser"
echo =======================================================
echo.
git push -u origin main
echo.
echo Done! If it pushed successfully, check:
echo https://github.com/MDyaqoob-ali/Setu-Route
echo.
pause
