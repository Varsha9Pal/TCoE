@echo off
title TCoE Engagement Server
echo ========================================================
echo         Starting TCoE Engagement Review Server
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ (version 18 or higher)
    echo.
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] First time run detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

:: Launch browser in background after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the Express server
echo [INFO] Starting server on http://localhost:3000 ...
echo [INFO] Press Ctrl + C to stop the server anytime.
echo.
call npm start
pause
