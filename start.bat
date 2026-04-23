@echo off
echo Starting GolfGives Backend...
cd /d "%~dp0server"
start cmd /k "npm run dev"

echo Starting GolfGives Frontend...
cd /d "%~dp0client"
start cmd /k "npm run dev"

echo.
echo Both servers started!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
