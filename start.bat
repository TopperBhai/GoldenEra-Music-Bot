@echo off
echo.
echo ========================================
echo  GoldenEra Bot - Installation Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo.
    pause
    exit /b 1
)

echo [INFO] npm version:
npm --version
echo.

REM Install dependencies
echo [STEP 1/3] Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Dependencies installed!
echo.

REM Check if config.json has been configured
findstr "YOUR_BOT_TOKEN_HERE" config.json >nul
if %errorlevel% equ 0 (
    echo ========================================
    echo  IMPORTANT: Configure Your Bot
    echo ========================================
    echo.
    echo Please edit config.json and add:
    echo   1. Your bot token
    echo   2. Your client ID
    echo.
    echo See SETUP_GUIDE.md for detailed instructions.
    echo.
    pause
    exit /b 0
)

echo [STEP 2/3] Configuration detected!
echo.

echo [STEP 3/3] Starting bot...
echo.
echo ========================================
echo  Bot is starting...
echo ========================================
echo.

call npm start

pause
