@echo on
setlocal

echo ==== TEST START ====

where pm2
echo.

pm2 -v
echo PM2 WORKS

pause