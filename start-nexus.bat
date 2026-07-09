@echo off
setlocal enabledelayedexpansion

REM Navigate to the project root.
set "ROOT=%~dp0"
cd /d "%ROOT%"

REM Resolve Python executable and pip wrapper.
set "PYEXEC=python"
where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3 and add it to PATH.
    goto :error
  )
  set "PYEXEC=py"
)

set "PIPEXEC=pip"
where pip >nul 2>&1
if errorlevel 1 (
  set "PIPEXEC=%PYEXEC% -m pip"
)

REM Verify required tools.
echo Checking tools...
call :check_tool docker "Docker"
call :check_tool node "Node.js"
call :check_tool npm "npm"
echo.

echo Checking Docker daemon...
docker info >nul 2>&1
if errorlevel 1 (
  call :start_docker_desktop
  call :wait_for_docker
) else (
  echo Docker daemon is already running.
)
echo.

echo Starting infrastructure...
call :start_infrastructure
echo.

echo Launching backend and frontend terminals...
call :launch_backend
call :launch_frontend

echo Waiting for startup windows...
timeout /t 5 /nobreak >nul

echo Opening the web UI...
start "" "http://localhost:3000"
start "" "http://localhost:8000/docs"

echo.
echo ======================================
echo NEXUS AI Development Environment Ready
echo ======================================
echo.
echo Docker: Running
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Happy Coding!
goto :eof

:check_tool
set "TOOL=%~1"
set "LABEL=%~2"
where %TOOL% >nul 2>&1
if errorlevel 1 (
  echo ERROR: %LABEL% not found in PATH.
  goto :error
)
goto :eof

:start_docker_desktop
echo Docker CLI is available but the daemon is not responding.
echo Attempting to launch Docker Desktop...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
  start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
  start "" "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
) else (
  echo ERROR: Docker Desktop executable not found.
  goto :error
)
timeout /t 10 /nobreak >nul
goto :eof

:wait_for_docker
set "TRIES=18"
:docker_loop
if %TRIES% leq 0 (
  echo ERROR: Docker did not become ready in time.
  goto :error
)
docker info >nul 2>&1
if errorlevel 1 (
  timeout /t 5 /nobreak >nul
  set /a TRIES-=1
  goto :docker_loop
)
echo Docker is ready.
goto :eof

:start_infrastructure
docker compose -f infra/docker/docker-compose.yml up -d
if errorlevel 1 (
  echo ERROR: Failed to start Docker Compose infrastructure.
  goto :error
)
call :wait_for_services
goto :eof

:wait_for_services
echo Waiting for PostgreSQL, Redis, and ChromaDB to become healthy...
set "TRIES=24"
:service_loop
set "POSTGRES_STATUS="
set "REDIS_STATUS="
set "CHROMA_STATUS="
set "POSTGRES_OK=0"
set "REDIS_OK=0"
set "CHROMA_OK=0"

for /f "delims=" %%A in ('docker inspect --format="{{.State.Health.Status}}" nexus-postgres 2^>nul') do set "POSTGRES_STATUS=%%A"
if /I "%POSTGRES_STATUS%"=="healthy" set "POSTGRES_OK=1"

for /f "delims=" %%A in ('docker inspect --format="{{.State.Status}}" nexus-redis 2^>nul') do set "REDIS_STATUS=%%A"
if /I "%REDIS_STATUS%"=="running" set "REDIS_OK=1"

for /f "delims=" %%A in ('docker inspect --format="{{.State.Status}}" nexus-chromadb 2^>nul') do set "CHROMA_STATUS=%%A"
if /I "%CHROMA_STATUS%"=="running" set "CHROMA_OK=1"

if %POSTGRES_OK%==1 if %REDIS_OK%==1 if %CHROMA_OK%==1 (
  echo Containers are running.
  goto :chroma_http_check
)

if %TRIES% leq 0 (
  echo ERROR: One or more infrastructure services failed to start.
  docker ps --filter "name=nexus-postgres" --filter "name=nexus-redis" --filter "name=nexus-chromadb"
  goto :error
)
timeout /t 5 /nobreak >nul
set /a TRIES-=1
goto :service_loop

:chroma_http_check
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:8001/' -UseBasicParsing -TimeoutSec 5 > $null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo Warning: ChromaDB HTTP endpoint is not responding yet.
  timeout /t 5 /nobreak >nul
  set /a TRIES-=1
  if %TRIES% gtr 0 goto :service_loop
)
echo Infrastructure services are healthy.
goto :eof

:launch_backend
echo Launching backend in a new terminal...
start "Backend" cmd /k "cd /d \"%ROOT%apps\api\" && if not exist \".venv\" (%PYEXEC% -m venv .venv) && call .venv\Scripts\activate.bat && %PIPEXEC% install -r requirements.txt && uvicorn app.main:app --reload --port 8000"
goto :eof

:launch_frontend
echo Launching frontend in a new terminal...
start "Frontend" cmd /k "cd /d \"%ROOT%apps\web\" && npm install && npm run dev"
goto :eof

:error
echo.
echo NEXUS AI startup failed. Please fix the issues above and try again.
exit /b 1
