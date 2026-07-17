@echo off
echo ==================================================
echo   CHIME - FRONTEND CLIENT STARTUP
echo ==================================================
echo.
echo [1/2] Installing client dependencies (if needed)...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed in client directory.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Launching Vite development server (port 5173)...
echo ==================================================
call npm run dev
