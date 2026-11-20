@echo off
REM MyDay Platform — Windows Setup Script (Command Prompt / Double Click)
title MyDay Setup

echo ========================================
echo   MyDay Platform - Environment Setup
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js LTS from https://nodejs.org
    pause
    exit /b 1
)

where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing pnpm globally...
    call npm install -g pnpm
)

if not exist apps\api\.env (
    if exist .env.example (
        copy .env.example apps\api\.env
        echo Created apps\api\.env from .env.example
    )
)

if not exist apps\client\.env (
    echo EXPO_PUBLIC_API_URL=http://localhost:4000 > apps\client\.env
    echo Created apps\client\.env with default API URL
)

echo Installing all packages across monorepo...
call pnpm install

echo Building workspace packages...
call pnpm build

echo Running integration tests...
call pnpm test

echo.
echo ========================================
echo   Setup completed successfully!
echo ========================================
echo.
echo Start API with:    pnpm dev:api
echo Start Web with:    pnpm dev:web
echo.
pause
