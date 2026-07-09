$ErrorActionPreference = 'Stop'

$Root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $Root

function Write-Status($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Test-Tool($Name, $Label) {
    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        return $true
    }
    Write-Status "ERROR: $Label not found in PATH." Red
    return $false
}

function Get-PythonExecutable() {
    if (Test-Tool python "Python") { return 'python' }
    if (Test-Tool py "Python launcher") { return 'py' }
    return $null
}

function Get-PipExecutable($Python) {
    if (Get-Command pip -ErrorAction SilentlyContinue) { return 'pip' }
    return "$Python -m pip"
}

function Ensure-DockerDesktop() {
    Write-Status 'Checking Docker daemon...' Cyan
    if (docker info > $null 2>&1) {
        Write-Status 'Docker daemon is already running.' Green
        return
    }

    $paths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles(x86)\Docker\Docker\Docker Desktop.exe"
    )

    foreach ($path in $paths) {
        if (Test-Path $path) {
            Write-Status "Launching Docker Desktop from $path" Yellow
            Start-Process -FilePath $path
            Start-Sleep -Seconds 10
            return
        }
    }

    Write-Status 'ERROR: Docker Desktop executable not found.' Red
    throw 'Docker Desktop missing.'
}

function Wait-ForDocker() {
    for ($i = 0; $i -lt 18; $i++) {
        if (docker info > $null 2>&1) {
            Write-Status 'Docker is ready.' Green
            return
        }
        Start-Sleep -Seconds 5
    }
    throw 'Docker did not become ready in time.'
}

function Wait-ForServices() {
    Write-Status 'Waiting for PostgreSQL, Redis, and ChromaDB...' Cyan
    for ($i = 0; $i -lt 24; $i++) {
        $postgres = docker inspect --format='{{.State.Health.Status}}' nexus-postgres 2>$null
        $redis = docker inspect --format='{{.State.Status}}' nexus-redis 2>$null
        $chroma = docker inspect --format='{{.State.Status}}' nexus-chromadb 2>$null

        if ($postgres -eq 'healthy' -and $redis -eq 'running' -and $chroma -eq 'running') {
            Write-Status 'Infrastructure containers are running.' Green
            try {
                Invoke-WebRequest -Uri 'http://127.0.0.1:8001/' -UseBasicParsing -TimeoutSec 5 | Out-Null
                Write-Status 'ChromaDB HTTP endpoint is responding.' Green
                return
            } catch {
                Write-Status 'Waiting for ChromaDB HTTP endpoint...' Yellow
            }
        }

        Start-Sleep -Seconds 5
    }
    throw 'Infrastructure services did not become healthy in time.'
}

function Start-Terminal($Title, $Command) {
    $wrapped = "title $Title & $Command"
    Start-Process -FilePath cmd.exe -ArgumentList '/k', $wrapped
}

$pythonExe = Get-PythonExecutable
if (-not $pythonExe) { throw 'Python is required.' }

$pipExe = Get-PipExecutable $pythonExe

Write-Status 'Checking required tools...' Cyan
if (-not (Test-Tool docker 'Docker')) { throw 'Docker is required.' }
if (-not (Test-Tool node 'Node.js')) { throw 'Node.js is required.' }
if (-not (Test-Tool npm 'npm')) { throw 'npm is required.' }
if (-not (Test-Tool $pythonExe 'Python')) { throw 'Python is required.' }

Ensure-DockerDesktop
Wait-ForDocker

Write-Status 'Starting infrastructure...' Cyan
docker compose -f infra/docker/docker-compose.yml up -d | Out-Null
Wait-ForServices

Write-Status 'Opening backend terminal...' Cyan
$backendCommand = "cd /d `"$Root\apps\api`" & if not exist `.venv` ($pythonExe -m venv .venv) & $pipExe install -r requirements.txt & uvicorn app.main:app --reload --port 8000"
Start-Terminal 'Backend' $backendCommand

Write-Status 'Opening frontend terminal...' Cyan
$frontendCommand = "cd /d `"$Root\apps\web`" & npm install & npm run dev"
Start-Terminal 'Frontend' $frontendCommand

Start-Sleep -Seconds 5
Write-Status 'Opening browser windows...' Cyan
Start-Process 'http://localhost:3000'
Start-Process 'http://localhost:8000/docs'

Write-Status '======================================' Green
Write-Status 'NEXUS AI Development Environment Ready' Green
Write-Status '======================================' Green
Write-Status ''
Write-Status 'Docker: Running' Green
Write-Status 'Backend: http://localhost:8000' Green
Write-Status 'API Docs: http://localhost:8000/docs' Green
Write-Status 'Frontend: http://localhost:3000' Green
Write-Status ''
Write-Status 'Happy Coding!' Green
