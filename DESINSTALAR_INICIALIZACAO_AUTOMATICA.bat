@echo off
title QualiMed - Remover Inicializacao Automatica
cd /d "%~dp0"

echo ===================================================================
echo   REMOVER INICIALIZACAO AUTOMATICA DO QUALIMED
echo ===================================================================
echo.

set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\QualiMed_Host.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%" >nul 2>nul
    echo [SUCESSO] Inicializacao automatica removida com sucesso!
) else (
    echo [INFO] O QualiMed nao estava configurado para iniciar automaticamente.
)

echo.
pause
exit /b
