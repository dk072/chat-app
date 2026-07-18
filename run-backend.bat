@echo off
echo ==================================================
echo   CHIME - BACKEND CONFIGURATION AND STARTUP (SQLite)
echo ==================================================

echo.
echo [1/4] Using existing .env configuration...
rem copy /Y "server\.env.example" "server\.env" >nul
echo Server environment is configured via server\.env

echo.
echo [2/4] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Syncing SQLite database schema with Prisma...
call npx prisma db push
if %errorlevel% neq 0 (
    echo [ERROR] Database schema sync failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Seeding initial test data (Alice, Bob, Antigravity, Admin)...
call npm run db:seed
if %errorlevel% neq 0 (
    echo [WARNING] Seeding failed or already completed. Continuing...
)

echo.
echo ==================================================
echo   Starting Express - Socket.IO server...
echo ==================================================
call npm run dev
