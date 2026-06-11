@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting Game Map Stitcher...
del "%~dp0server-url.txt" >nul 2>nul
start "Game Map Stitcher Server" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
for /l %%i in (1,1,10) do (
  if exist "%~dp0server-url.txt" goto open_url
  timeout /t 1 /nobreak >nul
)
:open_url
if exist "%~dp0server-url.txt" (
  set /p APP_URL=<"%~dp0server-url.txt"
)
if "%APP_URL%"=="" set APP_URL=http://localhost:3000/
start "" "%APP_URL%"
echo.
echo If the browser does not open, visit:
echo %APP_URL%
echo.
echo Phone URL on the same Wi-Fi:
echo http://192.168.2.12:3000/
echo.
pause
