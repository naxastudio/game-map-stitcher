@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动游戏地图拼接器...
del "%~dp0server-url.txt" >nul 2>nul
start "游戏地图拼接器服务" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
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
echo 如果浏览器没有自动打开，请手动访问:
echo %APP_URL%
echo.
echo 手机上访问:
echo http://192.168.2.12:3000/
echo.
pause
