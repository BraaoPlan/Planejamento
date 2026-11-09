@echo off
title QualiMed - Encerrar Servidor
pushd "%~dp0"

echo ===================================================================
echo   ENCERRANDO SERVIDOR QUALIMED
echo ===================================================================
echo.

:: 1. Sinalizar ao Watchdog para nao reiniciar
echo 1 > "encerrar.flag"

:: 2. Localizar e encerrar o processo ouvindo na porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do (
    if not "%%a"=="0" (
        echo [INFO] Finalizando processo PID %%a...
        taskkill /f /pid %%a >nul 2>nul
    )
)

:: 3. Limpar status de servidor ativo na rede
if exist "servidor_ativo.json" del /f /q "servidor_ativo.json" >nul 2>nul

ping 127.0.0.1 -n 2 >nul

:: 4. Limpar flag
if exist "encerrar.flag" del /f /q "encerrar.flag" >nul 2>nul

echo.
echo ===================================================================
echo  Servidor QualiMed encerrado com sucesso!
echo ===================================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit /b
