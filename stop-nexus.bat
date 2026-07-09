@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%"
echo Shutting down Nexus AI infrastructure...
docker compose -f infra/docker/docker-compose.yml down
if errorlevel 1 echo WARNING: Docker compose shutdown reported an error.
echo.
echo Attempting to close Backend and Frontend windows...
taskkill /FI "WINDOWTITLE eq Backend" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend" /T /F >nul 2>&1
echo.
echo NEXUS AI Development Environment Stopped
exit /b 0
