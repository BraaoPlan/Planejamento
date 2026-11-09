# ===================================================================
# QUALIMED - SCRIPT POWERSHELL DE INICIALIZAÇÃO
# ===================================================================
Set-Location $PSScriptRoot

Write-Host "===================================================================" -ForegroundColor Green
Write-Host "  🏥 QUALIMED - SISTEMA INTEGRADO DE GESTÃO DA QUALIDADE & EPA" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host ""

# Verificar se Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não foi encontrado!" -ForegroundColor Red
    Write-Host "Instale o Node.js em: https://nodejs.org/"
    pause
    exit
}

# Verificar se o servidor já está ativo na porta 3000
$portActive = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($portActive) {
    Write-Host "[INFO] O servidor QualiMed já está ativo na porta 3000!" -ForegroundColor Yellow
    Write-Host "[INFO] Abrindo navegador em http://localhost:3000 ..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    exit
}

# Agendar abertura do navegador após 2 segundos
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "[INFO] Iniciando servidor local..." -ForegroundColor Cyan
Write-Host "[INFO] Abrindo navegador em http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "[INFO] Pressione CTRL+C para encerrar o servidor." -ForegroundColor Yellow
Write-Host ""

node server.js
