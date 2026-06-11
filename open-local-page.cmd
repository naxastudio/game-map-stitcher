@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Opening local Game Map Stitcher page...
echo.
echo File:
echo %~dp0index.html
echo.
start "" "%~dp0index.html"
echo If it still does not open, copy this path into your browser address bar:
echo file:///%~dp0index.html
echo.
pause
