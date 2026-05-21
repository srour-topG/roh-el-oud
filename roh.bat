@echo off
setlocal

echo Starting backend with PM2 (silent)...

cd /d "%~dp0backend"

:: Start only if not already running
pm2 describe roh-system >NUL 2>&1
if errorlevel 1 (
    pm2 start server.js --name roh-system >NUL 2>&1
) else (
    pm2 restart roh-system >NUL 2>&1
)

:: Wait until server becomes available
echo Waiting for server to start...

:wait_loop
timeout /t 2 >NUL
curl -s http://localhost:6060/ >NUL 2>&1
if errorlevel 1 goto wait_loop

echo Server is ready. Opening browser...
start "" http://localhost:6060/

exit