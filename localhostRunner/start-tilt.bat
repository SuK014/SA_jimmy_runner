@echo off
echo ========================================
echo Starting SA_jimmy_runner with Tilt
echo ========================================
echo.
echo Prerequisites:
echo - Docker Desktop with Kubernetes enabled
echo - Tilt installed
echo.
echo Checking prerequisites...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker is running

REM Check if kubectl is available
kubectl cluster-info >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Kubernetes is not available. Please enable Kubernetes in Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Kubernetes is running

REM Check if Tilt is installed
tilt version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Tilt is not installed. Please install from https://docs.tilt.dev/install.html
    pause
    exit /b 1
)
echo [OK] Tilt is installed

echo.
echo ========================================
echo Starting Tilt...
echo ========================================
echo.
echo Tilt will:
echo 1. Build all Docker images
echo 2. Deploy to Kubernetes
echo 3. Set up port forwarding
echo 4. Open Tilt UI in browser
echo.
echo Services will be available at:
echo - Tilt UI: http://localhost:10350
echo - API Gateway: http://localhost:8080
echo - User Service: localhost:50051
echo - Plan Service: localhost:50052
echo.
echo Press Ctrl+C in Tilt UI to stop all services
echo.
pause

tilt up
