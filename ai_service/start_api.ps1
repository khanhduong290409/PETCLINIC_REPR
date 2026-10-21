# Script khởi động FastAPI AI service
# Chạy: .\start_api.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Write-Host "[AI] Dùng Python từ venv: $venvPython" -ForegroundColor Cyan
    & $venvPython -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload
} else {
    Write-Host "[AI] Không tìm thấy venv, dùng Python hệ thống..." -ForegroundColor Yellow
    python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload
}
