@echo off
title QualiMed - Configurar Inicializacao Automatica com o Windows
pushd "%~dp0"

echo ===================================================================
echo   CONFIGURAR QUALIMED PARA INICIAR AUTOMATICAMENTE COM O WINDOWS
echo ===================================================================
echo.
echo Este script adicionara o QualiMed para iniciar em segundo plano
echo sempre que seu computador for ligado, garantindo que o servidor
echo esteja sempre disponivel para toda a sua equipe.
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_SCRIPT=%~dp0INICIAR_EM_SEGUNDO_PLANO.vbs"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\QualiMed_Host.lnk"

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_SCRIPT%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Servidor QualiMed em Segundo Plano'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCESSO] Inicializacao automatica configurada com sucesso!
    echo O QualiMed agora subira automaticamente e de forma invisivel
    echo sempre que este computador for iniciado.
) else (
    echo [ERRO] Nao foi possivel criar o atalho de inicializacao automatica.
)

echo.
pause
exit /b
