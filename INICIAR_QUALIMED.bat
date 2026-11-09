@echo off
title QualiMed - Plataforma Integrada de Gestao da Qualidade (SIGQ)
pushd "%~dp0"

echo ===================================================================
echo   QUALIMED - PLATAFORMA INTEGRADA DE GESTAO DA QUALIDADE (SIGQ)
echo ===================================================================
echo.

:: 1. Se o servidor ja estiver ativo nesta maquina, abrir diretamente o navegador
netstat -ano | findstr ":3000 " | findstr /i "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [INFO] O servidor QualiMed ja esta rodando nesta maquina!
    echo [INFO] Abrindo o navegador...
    start http://localhost:3000
    exit /b
)

:: 2. Localizar o executavel do Node.js (prioridade: pasta bin na propria rede)
set "NODE_CMD=%~dp0bin\node.exe"

if not exist "%NODE_CMD%" (
    where node >nul 2>nul
    if %errorlevel% equ 0 set "NODE_CMD=node"
)

if not exist "%NODE_CMD%" if not "%NODE_CMD%"=="node" (
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_CMD=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    if exist "%USERPROFILE%\Downloads\node-v24.21.0-win-x64\node-v24.21.0-win-x64\node.exe" set "NODE_CMD=%USERPROFILE%\Downloads\node-v24.21.0-win-x64\node-v24.21.0-win-x64\node.exe"
)

if not exist "%NODE_CMD%" if not "%NODE_CMD%"=="node" (
    echo [ERRO] O executavel do Node.js nao foi localizado.
    echo Certifique-se de que a pasta bin\node.exe esta presente na rede.
    pause
    exit /b
)

:: 3. Iniciar o servidor local conectado ao banco de dados compartilhado da rede
echo [INFO] Iniciando o QualiMed...
echo [BANCO CENTRAL] Conectando ao banco compartilhado qualimed.sqlite...
start "" /min "%NODE_CMD%" server.js

:: Aguardar 2 segundos para subir a porta 3000
ping 127.0.0.1 -n 3 >nul

:: 4. Abrir o navegador conectado ao sistema
echo [INFO] Abrindo o navegador...
start http://localhost:3000
exit /b
