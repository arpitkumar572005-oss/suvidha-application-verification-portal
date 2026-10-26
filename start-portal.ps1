# Suvidha Portal Startup Script
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  Suvidha | Application Validation Portal" -ForegroundColor DarkYellow
Write-Host "  Smart India Hackathon Prototype | Demonstration Environment" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor DarkYellow

$BackendDir = Join-Path $PSScriptRoot "backend"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$BackendDir'; npm start"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend Vite Server (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendDir'; npm run dev"

Write-Host "`nSuvidha Portal is launching:" -ForegroundColor Green
Write-Host "  - Frontend URL : http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend API  : http://localhost:5000/api" -ForegroundColor White
Write-Host "  - Sample User  : arpit@example.com / Demo@123" -ForegroundColor White
Write-Host "  - Reviewer     : reviewer@suvidha.gov.demo / Demo@123" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor DarkYellow
